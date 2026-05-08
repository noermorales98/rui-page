'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import type { DealStage } from '@prisma/client'
import { DollarSign, Plus, X } from 'lucide-react'
import { createSale } from '../actions'
import { Button } from '@/app/crm/_components/ui'

type ContactOption = {
  id: number
  name: string
  email: string
}

type DealOption = {
  id: number
  contactId: number
  courseName: string | null
  stage: DealStage
  contact: ContactOption
}

type Props = {
  deals: DealOption[]
}

const STATUS_OPTIONS = [
  { value: 'PAID', label: 'Pagada' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'REFUNDED', label: 'Reembolsada' },
  { value: 'CANCELED', label: 'Cancelada' },
]

const METHOD_OPTIONS = [
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'CASH', label: 'Efectivo' },
  { value: 'STRIPE', label: 'Stripe' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'OTHER', label: 'Otro' },
]

const STAGE_LABELS: Record<DealStage, string> = {
  LEAD: 'Lead',
  DEMO: 'Demo',
  NEGOTIATION: 'Negociación',
  ENROLLED: 'Inscrito',
}

function todayForInput() {
  return new Date().toISOString().slice(0, 10)
}

export function CreateSaleModal({ deals }: Props) {
  const [open, setOpen] = useState(false)
  const submittedRef = useRef(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ContactOption[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null)
  const [selectedDealId, setSelectedDealId] = useState('')
  const [productName, setProductName] = useState('')
  const [state, formAction, isPending] = useActionState(createSale, null)

  const contactDeals = useMemo(
    () => deals.filter((deal) => deal.contactId === selectedContact?.id),
    [deals, selectedContact],
  )

  useEffect(() => {
    if (!searchQuery.trim()) {
      return
    }

    if (searchTimer.current) clearTimeout(searchTimer.current)

    searchTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/crm/contacts-search?q=${encodeURIComponent(searchQuery)}`)
        if (!response.ok) return
        const results = (await response.json()) as ContactOption[]
        setSearchResults(results)
        setShowDropdown(results.length > 0)
      } catch {
        // network error — ignore
      }
    }, 300)

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchQuery])

  useEffect(() => {
    if (submittedRef.current && !isPending && state?.message) {
      const id = window.setTimeout(() => {
        setOpen(false)
        submittedRef.current = false
        setSearchQuery('')
        setSearchResults([])
        setShowDropdown(false)
        setSelectedContact(null)
        setSelectedDealId('')
        setProductName('')
      }, 0)

      return () => window.clearTimeout(id)
    }
  }, [isPending, state])

  function chooseContact(contact: ContactOption) {
    setSelectedContact(contact)
    setSearchQuery(contact.name)
    setSearchResults([])
    setShowDropdown(false)
    setSelectedDealId('')
  }

  function chooseDeal(dealId: string) {
    setSelectedDealId(dealId)
    const deal = deals.find((item) => item.id === Number(dealId))
    if (deal?.courseName && !productName.trim()) setProductName(deal.courseName)
  }

  function close() {
    setOpen(false)
    submittedRef.current = false
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
      >
        <Plus size={16} strokeWidth={2} />
        Registrar venta
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="bg-white rounded-[28px] p-7 w-full max-w-md max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-modal-title"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#dfff00] p-2 text-[#080808]">
                  <DollarSign size={18} />
                </span>
                <h2 id="sale-modal-title" className="text-xl font-semibold tracking-[-0.03em] text-[#080808]">
                  Registrar venta
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="w-8 h-8 rounded-full bg-[#f0f1f3] flex items-center justify-center text-[#8a8a8a] hover:bg-[#e5e7eb] transition border-none cursor-pointer"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            {state?.error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
                {state.error}
              </div>
            )}

            <form action={formAction} onSubmit={() => { submittedRef.current = true }} className="space-y-4">
              <input type="hidden" name="contactId" value={selectedContact?.id ?? ''} />

              <div>
                <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">
                  Contacto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value)
                      if (!event.target.value.trim()) {
                        setSearchResults([])
                        setShowDropdown(false)
                      }
                      if (selectedContact && event.target.value !== selectedContact.name) {
                        setSelectedContact(null)
                        setSelectedDealId('')
                      }
                    }}
                    onBlur={() => window.setTimeout(() => setShowDropdown(false), 150)}
                    placeholder="Buscar por nombre o email..."
                    className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 text-sm border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition placeholder:text-[#aaa]"
                  />
                  {showDropdown && (
                    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1">
                      {searchResults.map((contact) => (
                        <li key={contact.id}>
                          <button
                            type="button"
                            onMouseDown={() => chooseContact(contact)}
                            className="w-full cursor-pointer border-none bg-transparent px-3 py-2 text-left text-sm hover:bg-[#f7f8fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7]"
                          >
                            <span className="font-medium text-gray-900">{contact.name}</span>
                            <span className="ml-2 text-xs text-gray-400">{contact.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">
                  Oportunidad del pipeline
                </label>
                <select
                  name="dealId"
                  value={selectedDealId}
                  onChange={(event) => chooseDeal(event.target.value)}
                  disabled={!selectedContact || contactDeals.length === 0}
                  className="bg-[#f7f8fa] rounded-full px-4 py-2.5 w-full border border-[#f2f2f2] outline-none focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9ca3af] disabled:opacity-50"
                >
                  <option value="">Sin oportunidad vinculada</option>
                  {contactDeals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      #{deal.id} · {deal.courseName || 'Sin curso'} · {STAGE_LABELS[deal.stage]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">
                    Producto / curso <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="productName"
                    value={productName}
                    onChange={(event) => setProductName(event.target.value)}
                    required
                    minLength={2}
                    placeholder="Metodo de los 4 Angeles"
                    className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 text-sm border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition placeholder:text-[#aaa]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">
                    Monto <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="amount"
                    required
                    inputMode="decimal"
                    placeholder="1250.00"
                    className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 text-sm border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition placeholder:text-[#aaa]"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Moneda</label>
                  <input
                    name="currency"
                    defaultValue="MXN"
                    maxLength={3}
                    className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 text-sm uppercase border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Estado</label>
                  <select
                    name="status"
                    defaultValue="PAID"
                    className="bg-[#f7f8fa] rounded-full px-4 py-2.5 w-full border border-[#f2f2f2] outline-none focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9ca3af]"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Metodo</label>
                  <select
                    name="paymentMethod"
                    defaultValue="TRANSFER"
                    className="bg-[#f7f8fa] rounded-full px-4 py-2.5 w-full border border-[#f2f2f2] outline-none focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9ca3af]"
                  >
                    {METHOD_OPTIONS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Fecha</label>
                  <input
                    name="soldAt"
                    type="date"
                    defaultValue={todayForInput()}
                    className="w-full bg-[#f7f8fa] rounded-full px-5 py-3 text-sm border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5">Notas</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Detalles de pago, referencia o acuerdo..."
                  className="w-full bg-[#f7f8fa] rounded-2xl px-5 py-3 text-sm border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition placeholder:text-[#aaa] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={close}
                  variant="secondary"
                  fullWidth
                  size="lg"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !selectedContact}
                  fullWidth
                  size="lg"
                >
                  {isPending ? 'Guardando...' : 'Registrar venta'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
