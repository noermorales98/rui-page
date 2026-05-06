'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/crm-login' })}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
      style={{ color: '#64748b' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#ef4444'
        e.currentTarget.style.background = '#1e1e2e'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#64748b'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <LogOut size={16} />
      <span>Cerrar sesión</span>
    </button>
  )
}
