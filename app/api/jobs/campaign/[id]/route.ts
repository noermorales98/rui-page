import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCampaignFrom, getMailerTransporter } from '@/lib/mailer'
import { renderCampaignEmail } from '@/app/crm/campanas/_lib/email-template'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'
const BATCH_SIZE = 50

function verifyJobToken(req: NextRequest) {
  const secret = process.env.JOBS_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyJobToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const campaignId = Number(id)
  if (!Number.isInteger(campaignId) || campaignId < 1) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 })
  }

  const campaign = await prisma.crmCampaign.findUnique({
    where: { id: campaignId },
  })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['SENDING', 'PARTIAL', 'FAILED'].includes(campaign.status)) {
    return NextResponse.json({ error: 'Campaign not in sendable state' }, { status: 400 })
  }

  const pendingRecipients = await prisma.crmCampaignRecipient.findMany({
    where: { campaignId, status: 'PENDING' },
    take: BATCH_SIZE,
    orderBy: { id: 'asc' },
  })

  const transporter = getMailerTransporter()
  const from = getCampaignFrom(campaign.fromName, campaign.fromEmail)
  const sentActivities: Prisma.ContactActivityCreateManyInput[] = []
  let sent = 0
  let failed = 0

  for (const recipient of pendingRecipients) {
    const email = renderCampaignEmail({
      subject: campaign.subject,
      previewText: campaign.previewText,
      bodyText: campaign.bodyText ?? campaign.bodyHtml ?? '',
      contact: {
        name: recipient.name,
        email: recipient.email,
        phone: null,
        projectName: null,
      },
    })

    try {
      await transporter.sendMail({
        from,
        to: recipient.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
        headers: {
          'List-Unsubscribe': `<${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(recipient.email)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      sent++
      await prisma.crmCampaignRecipient.update({
        where: { id: recipient.id },
        data: { status: 'SENT', sentAt: new Date(), errorMessage: null },
      })

      if (recipient.contactId) {
        sentActivities.push({
          contactId: recipient.contactId,
          type: 'CAMPAIGN_SENT',
          body: `Campaña "${campaign.name}": ${campaign.subject}`,
        })
      }
    } catch (error) {
      failed++
      await prisma.crmCampaignRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        },
      })
    }
  }

  if (sentActivities.length > 0) {
    await prisma.contactActivity.createMany({ data: sentActivities })
  }

  // Check if all recipients are now processed
  const remaining = await prisma.crmCampaignRecipient.count({
    where: { campaignId, status: 'PENDING' },
  })

  if (remaining === 0) {
    const totals = await prisma.crmCampaignRecipient.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: true,
    })
    const countByStatus = Object.fromEntries(totals.map((r) => [r.status, r._count]))
    const totalSent = countByStatus['SENT'] ?? 0
    const totalFailed = countByStatus['FAILED'] ?? 0
    const finalStatus = totalFailed === 0 ? 'SENT' : totalSent === 0 ? 'FAILED' : 'PARTIAL'

    await prisma.crmCampaign.update({
      where: { id: campaignId },
      data: {
        status: finalStatus,
        sentCount: totalSent,
        failedCount: totalFailed,
        sentAt: campaign.sentAt ?? new Date(),
      },
    })
  }

  return NextResponse.json({ sent, failed, remaining })
}
