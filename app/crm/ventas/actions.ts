'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { normalizeMoneyInput } from './_lib/sales-metrics'

type SaleState = { error?: string; message?: string } | null

const saleStatusValues = ['PENDING', 'PAID', 'REFUNDED', 'CANCELED'] as const
const paymentMethodValues = ['CASH', 'TRANSFER', 'CARD', 'STRIPE', 'PAYPAL', 'OTHER'] as const

const saleSchema = z.object({
  contactId: z.coerce.number().positive('Selecciona un contacto'),
  dealId: z.coerce.number().positive().optional(),
  productName: z.string().min(2, 'El producto debe tener al menos 2 caracteres'),
  amountCents: z.number().int().positive('El monto debe ser mayor a cero'),
  currency: z.string().trim().length(3, 'La moneda debe tener 3 letras').default('MXN'),
  status: z.enum(saleStatusValues).default('PAID'),
  paymentMethod: z.enum(paymentMethodValues).default('OTHER'),
  soldAt: z.string().min(1, 'La fecha de venta es obligatoria').refine(
    (value) => !Number.isNaN(Date.parse(value)),
    'La fecha de venta no es valida',
  ),
  notes: z.string().optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(saleStatusValues),
})

async function requireSession() {
  const session = await auth()
  if (!session?.user) return null
  return session
}

function nullableText(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || undefined
}

function revalidateSalesPaths(contactId?: number | null) {
  revalidatePath('/crm/ventas')
  revalidatePath('/crm/pipeline')
  revalidatePath('/crm/contactos')
  if (contactId) revalidatePath(`/crm/contactos/${contactId}`)
}

export async function createSale(
  _prevState: SaleState,
  formData: FormData,
): Promise<SaleState> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const amountCents = normalizeMoneyInput((formData.get('amount') as string) ?? '')
  const rawDealId = Number(formData.get('dealId'))

  const parsed = saleSchema.safeParse({
    contactId: formData.get('contactId'),
    dealId: Number.isInteger(rawDealId) && rawDealId > 0 ? rawDealId : undefined,
    productName: nullableText(formData.get('productName')) ?? '',
    amountCents: amountCents ?? 0,
    currency: (nullableText(formData.get('currency')) ?? 'MXN').toUpperCase(),
    status: (formData.get('status') as string) || 'PAID',
    paymentMethod: (formData.get('paymentMethod') as string) || 'OTHER',
    soldAt: (formData.get('soldAt') as string) || new Date().toISOString(),
    notes: nullableText(formData.get('notes')),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  const { contactId, dealId, status } = parsed.data

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.crmSale.create({
        data: {
          contactId,
          dealId: dealId ?? null,
          productName: parsed.data.productName,
          amountCents: parsed.data.amountCents,
          currency: parsed.data.currency,
          status,
          paymentMethod: parsed.data.paymentMethod,
          soldAt: new Date(parsed.data.soldAt),
          notes: parsed.data.notes ?? null,
          createdById: Number(session.user.id),
        },
        select: { id: true },
      })

      await tx.contactActivity.create({
        data: {
          contactId,
          type: 'SALE_CREATED',
          body: `Venta #${sale.id}: ${parsed.data.productName} por ${(parsed.data.amountCents / 100).toFixed(2)} ${parsed.data.currency}`,
          createdById: Number(session.user.id),
        },
      })

      if (status === 'PAID') {
        await tx.contact.update({
          where: { id: contactId },
          data: { status: 'CLIENT' },
        })

        if (dealId) {
          await tx.deal.update({
            where: { id: dealId },
            data: { stage: 'ENROLLED' },
          })
        }
      }
    })
  } catch {
    return { error: 'Error al registrar la venta' }
  }

  revalidateSalesPaths(contactId)
  return { message: 'Venta registrada' }
}

export async function updateSaleStatus(
  saleId: number,
  status: string,
): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  const parsed = updateStatusSchema.safeParse({ status })
  if (!parsed.success) return { error: 'Estado invalido' }

  try {
    const sale = await prisma.crmSale.update({
      where: { id: saleId },
      data: { status: parsed.data.status },
      select: { contactId: true, dealId: true, status: true },
    })

    if (sale.status === 'PAID') {
      await prisma.$transaction([
        prisma.contact.update({
          where: { id: sale.contactId },
          data: { status: 'CLIENT' },
        }),
        ...(sale.dealId
          ? [
              prisma.deal.update({
                where: { id: sale.dealId },
                data: { stage: 'ENROLLED' },
              }),
            ]
          : []),
      ])
    }

    revalidateSalesPaths(sale.contactId)
  } catch {
    return { error: 'Error al actualizar la venta' }
  }

  return {}
}

export async function deleteSale(saleId: number): Promise<{ error?: string }> {
  const session = await requireSession()
  if (!session) return { error: 'No autorizado' }

  let contactId: number | null = null

  try {
    const sale = await prisma.crmSale.delete({
      where: { id: saleId },
      select: { contactId: true },
    })
    contactId = sale.contactId
  } catch {
    return { error: 'Error al eliminar la venta' }
  }

  revalidateSalesPaths(contactId)
  return {}
}
