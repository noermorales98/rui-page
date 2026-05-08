import { forwardRef, type InputHTMLAttributes } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full bg-white rounded-full px-5 py-2.5 text-sm text-[#080808] outline-none border-2 border-transparent focus:border-[#dfff00] transition placeholder:text-[#aaa] ${className}`}
      {...props}
    />
  )
)
Input.displayName = 'Input'
