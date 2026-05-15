interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] bg-[var(--color-surface-container-low)] px-6 py-12 text-center ${className}`}
    >
      <p className="text-sm font-semibold text-[var(--color-on-surface)]">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
