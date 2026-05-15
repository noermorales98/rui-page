'use client'

import { TOK } from '@/app/crm/_lib/ui-tokens'

type FooterLink = { label: string; href: string }
type Props = { config: Record<string, unknown>; onChange: (cfg: Record<string, unknown>) => void }

export function FooterEditor({ config, onChange }: Props) {
  const links = (config.links ?? []) as FooterLink[]

  function updateLink(i: number, patch: Partial<FooterLink>) {
    const next = links.map((l, idx) => (idx === i ? { ...l, ...patch } : l))
    onChange({ ...config, links: next })
  }

  function addLink() {
    onChange({ ...config, links: [...links, { label: '', href: '' }] })
  }

  function removeLink(i: number) {
    onChange({ ...config, links: links.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="flex flex-col gap-4">
      <label>
        <span className={TOK.label}>Texto de copyright</span>
        <input className={TOK.inputNative} value={(config.text as string) ?? ''} onChange={(e) => onChange({ ...config, text: e.target.value })} />
      </label>
      <div>
        <p className={TOK.label}>Links</p>
        {links.map((link, i) => (
          <div key={i} className="mb-2 flex items-start gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <input className={TOK.inputNative} placeholder="Texto" value={link.label} onChange={(e) => updateLink(i, { label: e.target.value })} />
              <input className={TOK.inputNative} placeholder="URL" value={link.href} onChange={(e) => updateLink(i, { href: e.target.value })} />
            </div>
            <button type="button" className="mt-2 text-xs text-[var(--color-error)]" onClick={() => removeLink(i)}>×</button>
          </div>
        ))}
        <button type="button" className="mt-1 text-sm font-semibold text-[var(--color-primary)]" onClick={addLink}>+ Agregar link</button>
      </div>
    </div>
  )
}
