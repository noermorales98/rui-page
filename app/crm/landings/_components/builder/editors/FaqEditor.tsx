'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type FaqItem = { question: string; answer: string }
type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function FaqEditor({ config, onChange }: Props) {
  const items = (config.items ?? []) as FaqItem[]

  function updateItem(i: number, patch: Partial<FaqItem>) {
    onChange({ ...config, items: items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)) })
  }

  function addItem() {
    onChange({ ...config, items: [...items, { question: '', answer: '' }] })
  }

  function removeItem(i: number) {
    onChange({ ...config, items: items.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Título de sección</span>
        <input className={TOK.inputNative} value={(config.heading as string) ?? ''} onChange={(e) => onChange({ ...config, heading: e.target.value })} />
      </label>
      <div>
        <p className={TOK.label}>Preguntas</p>
        {items.map((item, i) => (
          <div key={i} className="mb-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-container-lowest)] p-3">
            <input className={`${TOK.inputNative} mb-2`} placeholder="Pregunta" value={item.question} onChange={(e) => updateItem(i, { question: e.target.value })} />
            <textarea className={TOK.inputNativeMultiline} rows={2} placeholder="Respuesta" value={item.answer} onChange={(e) => updateItem(i, { answer: e.target.value })} />
            <button type="button" className="mt-2 text-xs text-[var(--color-error)]" onClick={() => removeItem(i)}>× Eliminar</button>
          </div>
        ))}
        <button type="button" className="mt-1 text-sm font-semibold text-[var(--color-primary)]" onClick={addItem}>+ Agregar pregunta</button>
      </div>
    </div>
  )
}
