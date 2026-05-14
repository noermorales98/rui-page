'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import type { DealStage } from '@prisma/client'
import { DollarSign, Plus, X } from 'lucide-react'
import { createSale } from '../actions'
import { Button } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

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
            className={TOK.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-modal-title"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[var(--color-secondary-container)] p-2 text-[var(--color-on-secondary-container)]">
                  <DollarSign size={18} />
                </span>
                <h2 id="sale-modal-title" className={TOK.modalTitle}>
                  Registrar venta
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className={TOK.closeIconBtn}
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            {state?.error && (
              <div className={TOK.errorBox}>
                {state.error}
              </div>
            )}

            <form action={formAction} onSubmit={() => { submittedRef.current = true }} className="space-y-4">
              <input type="hidden" name="contactId" value={selectedContact?.id ?? ''} />

              <div>
                <label className={TOK.label}>
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
                    className={TOK.inputNative}
                  />
                  {showDropdown && (
                    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] py-1">
                      {searchResults.map((contact) => (
                        <li key={contact.id}>
                          <button
                            type="button"
                            onMouseDown={() => chooseContact(contact)}
                            className="w-full cursor-pointer border-none bg-transparent px-3 py-2 text-left text-sm transition hover:bg-[var(--color-surface-container)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]"
                          >
                            <span className="font-medium text-[var(--color-on-surface)]">{contact.name}</span>
                            <span className="ml-2 text-xs text-[var(--color-on-surface-variant)]">{contact.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <label className={TOK.label}>
                  Oportunidad del pipeline
                </label>
                <select
                  name="dealId"
                  value={selectedDealId}
                  onChange={(event) => chooseDeal(event.target.value)}
                  disabled={!selectedContact || contactDeals.length === 0}
                  className={`${TOK.selectLg} disabled:opacity-50`}
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
                  <label className={TOK.label}>
                    Producto / curso <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="productName"
                    value={productName}
                    onChange={(event) => setProductName(event.target.value)}
                    required
                    minLength={2}
                    placeholder="Metodo de los 4 Angeles"
                    className={TOK.inputNative}
                  />
                </div>
                <div>
                  <label className={TOK.label}>
                    Monto <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="amount"
                    required
                    inputMode="decimal"
                    placeholder="1250.00"
                    className={TOK.inputNative}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className={TOK.label}>Moneda</label>
                  <input
                    name="currency"
                    defaultValue="MXN"
                    maxLength={3}
                    className={TOK.inputNative}
                  />
                </div>
                <div>
                  <label className={TOK.label}>Estado</label>
                  <select
                    name="status"
                    defaultValue="PAID"
                    className={TOK.selectLg}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={TOK.label}>Metodo</label>
                  <select
                    name="paymentMethod"
                    defaultValue="TRANSFER"
                    className={TOK.selectLg}
                  >
                    {METHOD_OPTIONS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={TOK.label}>Fecha</label>
                  <input
                    name="soldAt"
                    type="date"
                    defaultValue={todayForInput()}
                    className={TOK.inputNative}
                  />
                </div>
              </div>

              <div>
                <label className={TOK.label}>Notas</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Detalles de pago, referencia o acuerdo..."
                  className={TOK.inputNativeMultiline}
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
