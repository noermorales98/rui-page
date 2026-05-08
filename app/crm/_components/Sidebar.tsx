import { auth } from '@/auth'
import SignOutButton from './SignOutButton'
import { SidebarNav } from './SidebarNav'

export default async function Sidebar() {
  const session = await auth()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <aside className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-5 flex flex-col gap-2 h-full">
      {/* Brand */}
      <div className="px-2 pb-4 border-b border-[#e5e7eb] mb-2">
        <span className="text-[17px] font-bold tracking-[-0.04em] text-[#080808]">Rui CRM</span>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto">
        <SidebarNav isAdmin={isAdmin} />
      </div>

      {/* Sign out */}
      <div className="pt-3 border-t border-[#e5e7eb]">
        <SignOutButton />
      </div>
    </aside>
  )
}
