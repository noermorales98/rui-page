'use client'

import { signOut } from 'next-auth/react'
import { HugeiconsIcon } from '@hugeicons/react'
import Logout01Icon from '@hugeicons/core-free-icons/Logout01Icon'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/crm-login' })}
      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 rounded-full text-[13.5px] font-medium text-[#8a8a8a] hover:bg-white hover:text-[#080808] transition-colors border-none bg-transparent cursor-pointer font-sans"
    >
      <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.5} className="opacity-60" />
      Cerrar sesión
    </button>
  )
}
