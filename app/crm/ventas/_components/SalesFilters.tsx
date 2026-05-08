'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const STATUSES = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PAID', label: 'Pagada' },
  { value: 'REFUNDED', label: 'Reembolsada' },
  { value: 'CANCELED', label: 'Cancelada' },
]

const METHODS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'STRIPE', label: 'Stripe' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'OTHER', label: 'Otro' },
]

export function SalesFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParam('q', value), 300)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Buscar por contacto, email o producto..."
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(event) => handleSearch(event.target.value)}
        className="min-w-72 bg-white rounded-full px-5 py-2.5 text-sm text-[#080808] outline-none border border-[#f2f2f2] focus:border-[#9ca3af] transition placeholder:text-[#aaa]"
      />

      <select
        value={searchParams.get('status') ?? ''}
        onChange={(event) => updateParam('status', event.target.value)}
        className="bg-white rounded-full px-4 py-2.5 text-sm text-[#080808] border border-[#f2f2f2] outline-none focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9ca3af] cursor-pointer"
      >
        <option value="">Estado: Todos</option>
        {STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('method') ?? ''}
        onChange={(event) => updateParam('method', event.target.value)}
        className="bg-white rounded-full px-4 py-2.5 text-sm text-[#080808] border border-[#f2f2f2] outline-none focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9ca3af] cursor-pointer"
      >
        <option value="">Metodo: Todos</option>
        {METHODS.map((method) => (
          <option key={method.value} value={method.value}>
            {method.label}
          </option>
        ))}
      </select>
    </div>
  )
}
