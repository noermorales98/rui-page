'use client'

import { Search, SlidersHorizontal } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useEffect } from 'react'
import type { Tag } from '@prisma/client'
import { Button, Card, Input } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface Props { tags: Tag[] }

export function ContactFilters({ tags }: Props) {
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

  const hasActiveFilters = ['q', 'status', 'source', 'tag'].some((key) => Boolean(searchParams.get(key)))

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-on-surface)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)]">
            <SlidersHorizontal size={17} strokeWidth={1.7} />
          </span>
          Filtros
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-end">
          <div className="relative w-full sm:w-72">
            <Search className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${TOK.textSubtle}`} size={16} strokeWidth={1.7} />
            <Input
              type="text"
              placeholder="Buscar nombre o email..."
              defaultValue={searchParams.get('q') ?? ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select value={searchParams.get('status') ?? ''} onChange={(e) => updateParam('status', e.target.value)} className={TOK.select}>
            <option value="">Estado: Todos</option>
            <option value="NEW">Nuevo</option>
            <option value="QUALIFIED">Calificado</option>
            <option value="CLIENT">Cliente</option>
          </select>
          <select value={searchParams.get('source') ?? ''} onChange={(e) => updateParam('source', e.target.value)} className={TOK.select}>
            <option value="">Fuente: Todas</option>
            <option value="WEBINAR">Webinar</option>
            <option value="FORM">Formulario</option>
            <option value="MANUAL">Manual</option>
            <option value="IMPORT">Importado</option>
          </select>
          {tags.length > 0 && (
            <select value={searchParams.get('tag') ?? ''} onChange={(e) => updateParam('tag', e.target.value)} className={TOK.select}>
              <option value="">Tag: Todos</option>
              {tags.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
            </select>
          )}
          {hasActiveFilters && (
            <Button variant="secondary" size="md" onClick={() => router.push('/crm/contactos')}>
              Limpiar
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
