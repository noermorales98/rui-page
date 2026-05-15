'use client'

import { useMemo, useState, useActionState } from 'react'
import type { FunnelPage } from '@prisma/client'
import { saveBlocksAction } from '../actions'
import type { FunnelBlock } from '@/lib/funnels/types'
import { Button } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

function coerceBlocks(value: unknown): FunnelBlock[] {
  return Array.isArray(value) ? (value as FunnelBlock[]) : []
}

function formatValue(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value ?? '')
}

export function FunnelContentEditor({ page }: { funnelId: number; page: FunnelPage }) {
  const initialBlocks = useMemo(() => coerceBlocks(page.blocks), [page.blocks])
  const [blocks, setBlocks] = useState<FunnelBlock[]>(initialBlocks)
  const [state, action, pending] = useActionState(saveBlocksAction.bind(null, page.id), null)

  function updateConfig(blockId: string, key: string, value: string) {
    setBlocks((current) =>
      current.map((block) =>
        block.id === blockId ? { ...block, config: { ...block.config, [key]: value } } : block,
      ),
    )
  }

  function move(blockId: string, direction: -1 | 1) {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === blockId)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
  }

  return (
    <form action={action} className={`${TOK.panel} ${TOK.panelPad}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={TOK.sectionTitle}>Contenido: {page.title ?? page.key}</h2>
          <p className={`mt-1 ${TOK.sectionSubtitle}`}>Edita campos simples por bloque. Para codigo avanzado usa la pestana HTML.</p>
        </div>
        <Button type="submit" disabled={pending}>{pending ? 'Guardando...' : 'Guardar contenido'}</Button>
      </div>

      <input type="hidden" name="blocks" value={JSON.stringify(blocks)} readOnly />

      <div className="mt-5 space-y-3">
        {blocks.map((block, index) => (
          <div key={block.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[var(--color-on-surface)]">{block.type}</p>
                <p className="text-xs text-[var(--color-on-surface-variant)]">Bloque {index + 1}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => move(block.id, -1)}>Subir</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => move(block.id, 1)}>Bajar</Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(block.config).map(([key, value]) => (
                <label key={key}>
                  <span className={TOK.label}>{key}</span>
                  {formatValue(value).length > 80 ? (
                    <textarea
                      value={formatValue(value)}
                      onChange={(event) => updateConfig(block.id, key, event.target.value)}
                      className={TOK.inputNativeMultiline}
                      rows={4}
                    />
                  ) : (
                    <input
                      value={formatValue(value)}
                      onChange={(event) => updateConfig(block.id, key, event.target.value)}
                      className={TOK.inputNative}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {state?.error && <div className={`${TOK.errorBox} mt-4`}>{state.error}</div>}
    </form>
  )
}
