import Link from 'next/link'
import { LayoutGrid, List } from 'lucide-react'

type View = 'list' | 'cards'

interface Props {
  current: View
  searchParams: Record<string, string | undefined>
}

export function ViewToggle({ current, searchParams }: Props) {
  function href(view: View) {
    const p = new URLSearchParams()
    Object.entries(searchParams).forEach(([k, v]) => { if (v && k !== 'view') p.set(k, v) })
    if (view === 'cards') p.set('view', 'cards')
    const qs = p.toString()
    return qs ? `?${qs}` : '?'
  }

  const btnBase = 'rounded-lg p-1.5 transition-colors'
  const active = `${btnBase} bg-[var(--color-surface-container-lowest)] shadow-sm text-[var(--color-on-surface)]`
  const inactive = `${btnBase} text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]`

  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-0.5">
      <Link href={href('list')} className={current === 'list' ? active : inactive} aria-label="Vista lista">
        <List size={16} />
      </Link>
      <Link href={href('cards')} className={current === 'cards' ? active : inactive} aria-label="Vista tarjetas">
        <LayoutGrid size={16} />
      </Link>
    </div>
  )
}
