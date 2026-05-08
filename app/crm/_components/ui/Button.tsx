import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[#080808] text-white hover:bg-[#222]',
  secondary: 'bg-white text-[#080808] hover:bg-[#f2f2f2]',
  accent: 'bg-[#dfff00] text-[#080808] hover:brightness-95',
  ghost: 'bg-transparent text-[#8a8a8a] hover:bg-white hover:text-[#080808]',
  danger: 'bg-red-50 text-red-700 hover:bg-red-100',
}

const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3.5 py-2 text-xs',
  md: 'min-h-10 px-5 py-2.5 text-sm',
  lg: 'min-h-12 px-6 py-3 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className = '', children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#f2f2f2] font-sans font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7] disabled:pointer-events-none disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
