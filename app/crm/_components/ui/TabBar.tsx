import Link from 'next/link'

export interface TabItem {
  key: string
  label: string
  href: string
  count?: number
}

interface Props {
  tabs: TabItem[]
  activeKey: string
}

export function TabBar({ tabs, activeKey }: Props) {
  return (
    <nav
      role="tablist"
      className="flex gap-0 border-b border-[var(--color-outline-variant)]"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey
        return (
          <Link
            key={tab.key}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? 'border-[var(--color-on-surface)] text-[var(--color-on-surface)]'
                : 'border-transparent text-[var(--color-on-surface-variant)] hover:border-[var(--color-outline-variant)] hover:text-[var(--color-on-surface)]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                isActive
                  ? 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)]'
                  : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'
              }`}>
                {tab.count}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
