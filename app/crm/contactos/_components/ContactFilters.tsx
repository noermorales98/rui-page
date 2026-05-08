'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useEffect } from 'react'
import type { Tag } from '@prisma/client'

interface Props { tags: Tag[] }

const selectClass = 'bg-white rounded-full px-4 py-2.5 text-sm text-[#080808] border-none outline-none focus:ring-2 focus:ring-[#dfff00] cursor-pointer shadow-sm'

export function ContactFilters({ tags }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    value ? params.set(key, value) : params.delete(key)
    params.delete('page')
    router.push(`?${params.toString()}`)
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParam('q', value), 300)
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => handleSearch(e.target.value)}
        className="bg-white rounded-full px-5 py-2.5 text-sm text-[#080808] outline-none border-2 border-transparent focus:border-[#dfff00] transition placeholder:text-[#aaa] shadow-sm w-64"
      />
      <select value={searchParams.get('status') ?? ''} onChange={(e) => updateParam('status', e.target.value)} className={selectClass}>
        <option value="">Estado: Todos</option>
        <option value="NEW">Nuevo</option>
        <option value="QUALIFIED">Calificado</option>
        <option value="CLIENT">Cliente</option>
      </select>
      <select value={searchParams.get('source') ?? ''} onChange={(e) => updateParam('source', e.target.value)} className={selectClass}>
        <option value="">Fuente: Todas</option>
        <option value="WEBINAR">Webinar</option>
        <option value="FORM">Formulario</option>
        <option value="MANUAL">Manual</option>
        <option value="IMPORT">Importado</option>
      </select>
      {tags.length > 0 && (
        <select value={searchParams.get('tag') ?? ''} onChange={(e) => updateParam('tag', e.target.value)} className={selectClass}>
          <option value="">Tag: Todos</option>
          {tags.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
        </select>
      )}
    </div>
  )
}
