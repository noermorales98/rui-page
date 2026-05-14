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
      className={`flex gap-1 border-b border-[var(--color-outline-variant)] ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary-fixed)] rounded-t-md ${
            active === tab.id
              ? 'text-[var(--color-on-surface)] border-b-2 border-[var(--color-on-surface)] -mb-px'
              : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
