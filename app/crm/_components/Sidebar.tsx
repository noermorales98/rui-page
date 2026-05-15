import type { Role } from '@prisma/client'
import { auth } from '@/auth'
import { SidebarNav } from './SidebarNav'

export default async function Sidebar() {
  const session = await auth()
  const role = (session?.user?.role ?? null) as Role | null

  return (
    <aside className="flex h-full min-h-0 w-full flex-col gap-px overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-container)] p-5">
      {/* Brand */}
      <div className="shrink-0 px-2 pb-4 pt-0.5">
        <span className="text-[17px] font-bold tracking-[-0.04em] text-[var(--color-on-surface)]">CRM Digital</span>
      </div>

      {/* Nav: sin scroll; el contenedor recorta si no cupiera */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <SidebarNav role={role} />
      </div>
    </aside>
  )
}
