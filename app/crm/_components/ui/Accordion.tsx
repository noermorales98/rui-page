'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function Accordion({ title, children, defaultOpen = false, className = '' }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`border-t border-[var(--color-outline-variant)] ${className}`}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-3 text-sm font-semibold text-[var(--color-on-surface)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-fixed)]"
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}
