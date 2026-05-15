'use client'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex flex-wrap gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-container-high)] p-1 ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-[calc(var(--radius-md)-4px)] px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] ${
            active === tab.id
              ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]'
              : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
