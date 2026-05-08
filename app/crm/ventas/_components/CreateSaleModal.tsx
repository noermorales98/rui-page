'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import type { DealStage } from '@prisma/client'
import { DollarSign, Plus, X } from 'lucide-react'
import { createSale } from '../actions'

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
      >
        <Plus size={16} />
        Registrar venta
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-modal-title"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <DollarSign size={18} />
                </span>
                <h2 id="sale-modal-title" className="text-lg font-semibold text-gray-900">
                  Registrar venta
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {state?.error && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </p>
            )}

            <form action={formAction} onSubmit={() => { submittedRef.current = true }} className="space-y-4">
              <input type="hidden" name="contactId" value={selectedContact?.id ?? ''} />

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {showDropdown && (
                    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      {searchResults.map((contact) => (
                        <li key={contact.id}>
                          <button
                            type="button"
                            onMouseDown={() => chooseContact(contact)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
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
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Oportunidad del pipeline
                </label>
                <select
                  name="dealId"
                  value={selectedDealId}
                  onChange={(event) => chooseDeal(event.target.value)}
                  disabled={!selectedContact || contactDeals.length === 0}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Producto / curso <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="productName"
                    value={productName}
                    onChange={(event) => setProductName(event.target.value)}
                    required
                    minLength={2}
                    placeholder="Metodo de los 4 Angeles"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Monto <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="amount"
                    required
                    inputMode="decimal"
                    placeholder="1250.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Moneda</label>
                  <input
                    name="currency"
                    defaultValue="MXN"
                    maxLength={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    name="status"
                    defaultValue="PAID"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Metodo</label>
                  <select
                    name="paymentMethod"
                    defaultValue="TRANSFER"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {METHOD_OPTIONS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Fecha</label>
                  <input
                    name="soldAt"
                    type="date"
                    defaultValue={todayForInput()}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Detalles de pago, referencia o acuerdo..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !selectedContact}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isPending ? 'Guardando...' : 'Registrar venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
