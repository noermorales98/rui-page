import { forwardRef } from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`min-h-10 w-full cursor-pointer rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-2.5 text-sm text-[var(--color-on-surface)] outline-none transition focus:border-[var(--color-outline)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        {...props}
      />
    )
  }
)

Select.displayName = 'Select'
