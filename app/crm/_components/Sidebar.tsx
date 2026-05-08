import { auth } from '@/auth'
import SignOutButton from './SignOutButton'
import { SidebarNav } from './SidebarNav'

export default async function Sidebar() {
  const session = await auth()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <aside className="flex h-full max-h-full flex-col gap-px overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-[#f7f8fa] p-5">
      {/* Brand */}
      <div className="px-2 pb-4 border-b border-[#e5e7eb] mb-2">
        <span className="text-[17px] font-bold tracking-[-0.04em] text-[#080808]">CRM Digital</span>
      </div>

      {/* Nav */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <SidebarNav isAdmin={isAdmin} />
      </div>

      {/* Sign out */}
      <div className="pt-3 border-t border-[#e5e7eb]">
        <SignOutButton />
      </div>
    </aside>
  )
}
