import { forwardRef } from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`w-full rounded-[var(--radius-md,10px)] border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-4 py-2.5 text-sm text-[var(--color-on-surface)] outline-none transition placeholder:text-[var(--color-on-surface-variant)]/60 focus:border-[var(--color-outline)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)] resize-none disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
