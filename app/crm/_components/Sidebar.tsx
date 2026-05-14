import type { Role } from '@prisma/client'
import { auth } from '@/auth'
import SignOutButton from './SignOutButton'
import { SidebarNav } from './SidebarNav'

export default async function Sidebar() {
  const session = await auth()
  const role = (session?.user?.role ?? null) as Role | null

  return (
    <aside className="flex h-full max-h-full flex-col gap-px overflow-hidden rounded-[28px] border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-5">
      {/* Brand */}
      <div className="px-2 pb-4 border-b border-[var(--color-outline-variant)] mb-2">
        <span className="text-[17px] font-bold tracking-[-0.04em] text-[var(--color-on-surface)]">CRM Digital</span>
      </div>

      {/* Nav */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <SidebarNav role={role} />
      </div>

      {/* Sign out */}
      <div className="pt-3 border-t border-[var(--color-outline-variant)]">
        <SignOutButton />
      </div>
    </aside>
  )
}
