'use client'

import { signOut } from 'next-auth/react'
import { HugeiconsIcon } from '@hugeicons/react'
import Logout01Icon from '@hugeicons/core-free-icons/Logout01Icon'

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/crm-login' })}
      className="flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-full border-none bg-transparent px-3.5 py-2.5 font-sans text-[13.5px] font-medium text-[#8a8a8a] transition hover:bg-white hover:text-[#080808] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7]"
    >
      <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.5} className="opacity-60" />
      Cerrar sesión
    </button>
  )
}
