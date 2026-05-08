import { forwardRef, type InputHTMLAttributes } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`min-h-10 w-full rounded-full border border-[#f2f2f2] bg-white px-5 py-2.5 text-sm text-[#080808] outline-none transition placeholder:text-[#aaa] focus:border-[#9ca3af] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    />
  )
)
Input.displayName = 'Input'
