import Link from 'next/link'

export type ListView = 'table' | 'cards'

interface ViewToggleProps {
  view: ListView
  searchParams?: Record<string, string | string[] | undefined>
  className?: string
}

function hrefFor(view: ListView, searchParams?: ViewToggleProps['searchParams']) {
  const params = new URLSearchParams()

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value === undefined) return
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item))
      return
    }
    params.set(key, value)
  })

  if (view === 'table') {
    params.delete('view')
  } else {
    params.set('view', view)
  }

  const query = params.toString()
  return query ? `?${query}` : '?'
}

export function ViewToggle({ view, searchParams, className = '' }: ViewToggleProps) {
  const options: Array<{ value: ListView; label: string }> = [
    { value: 'table', label: 'Tabla' },
    { value: 'cards', label: 'Tarjetas' },
  ]

  return (
    <div
      className={`inline-flex rounded-[var(--radius-md)] bg-[var(--color-surface-container-high)] p-1 ${className}`}
      aria-label="Cambiar vista"
    >
      {options.map((option) => {
        const active = option.value === view
        return (
          <Link
            key={option.value}
            href={hrefFor(option.value, searchParams)}
            className={`rounded-[calc(var(--radius-md)-4px)] px-3.5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] ${
              active
                ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            {option.label}
          </Link>
        )
      })}
    </div>
  )
}
