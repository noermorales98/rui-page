import { forwardRef, type InputHTMLAttributes } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`min-h-10 w-full rounded-[var(--radius-md)] border-0 bg-[var(--color-surface-container-lowest)] px-5 py-2.5 text-sm text-[var(--color-on-surface)] outline-none transition placeholder:text-[var(--color-on-surface-variant)]/60 hover:bg-[var(--color-surface-container-low)] focus-visible:bg-[var(--color-surface-container-lowest)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    />
  )
)
Input.displayName = 'Input'
