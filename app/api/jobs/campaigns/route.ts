import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 55

function verifyRequest(req: NextRequest): boolean {
  const jobSecret = process.env.JOBS_SECRET
  const cronSecret = process.env.CRON_SECRET

  const authHeader = req.headers.get('authorization')
  if (jobSecret && authHeader === `Bearer ${jobSecret}`) return true
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true

  return false
}

async function runCampaigns(baseUrl: string, jobSecret: string) {
  const sendingCampaigns = await prisma.crmCampaign.findMany({
    where: {
      status: { in: ['SENDING', 'PARTIAL', 'FAILED'] },
      recipients: { some: { status: 'PENDING' } },
    },
    select: { id: true, name: true },
  })

  if (sendingCampaigns.length === 0) {
    return { processed: 0, campaigns: [] }
  }

  const results: { id: number; name: string; sent: number; failed: number; remaining: number }[] = []

  for (const campaign of sendingCampaigns) {
    try {
      const res = await fetch(`${baseUrl}/api/jobs/campaign/${campaign.id}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${jobSecret}`,
          'content-type': 'application/json',
        },
      })
      if (res.ok) {
        const data = (await res.json()) as { sent: number; failed: number; remaining: number }
        results.push({ id: campaign.id, name: campaign.name, ...data })
      } else {
        results.push({ id: campaign.id, name: campaign.name, sent: 0, failed: 0, remaining: -1 })
      }
    } catch {
      results.push({ id: campaign.id, name: campaign.name, sent: 0, failed: 0, remaining: -1 })
    }
  }

  return { processed: results.length, campaigns: results }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000'
  const jobSecret = process.env.JOBS_SECRET!
  const result = await runCampaigns(baseUrl, jobSecret)
  return NextResponse.json(result)
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!verifyRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000'
  const jobSecret = process.env.JOBS_SECRET!
  const result = await runCampaigns(baseUrl, jobSecret)
  return NextResponse.json(result)
}
