import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'accent'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[#080808] text-white hover:bg-[#222]',
  secondary: 'bg-white text-[#080808] hover:bg-[#f2f2f2] shadow-sm',
  accent: 'bg-[#dfff00] text-[#080808] hover:brightness-95',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition cursor-pointer border-none font-sans disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
