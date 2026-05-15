'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { updateAvatar } from '../actions'

const AVATARS = ['avr1', 'avr2', 'avr3', 'avr4', 'avr5', 'avr6']

export function AvatarPicker({ currentImage }: { currentImage: string | null }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState(currentImage)

  function handleSelect(path: string) {
    if (path === selected || pending) return
    setSelected(path)
    startTransition(async () => {
      await updateAvatar(path)
      router.refresh()
    })
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {AVATARS.map((name) => {
        const path = `/avatar/${name}.webp`
        const isSelected = selected === path
        return (
          <button
            key={name}
            type="button"
            disabled={pending}
            onClick={() => handleSelect(path)}
            title={`Avatar ${name.replace('avr', '')}`}
            className={`relative aspect-square overflow-hidden rounded-full border-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed-dim)] disabled:cursor-wait ${
              isSelected
                ? 'border-[var(--color-accent-neon)] ring-2 ring-[var(--color-accent-neon)] ring-offset-2'
                : 'border-transparent opacity-70 hover:opacity-100 hover:border-[var(--color-surface-container-high)]'
            }`}
          >
            <Image
              src={path}
              alt={`Avatar ${name.replace('avr', '')}`}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        )
      })}
    </div>
  )
}
