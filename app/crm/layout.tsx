import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Sidebar from './_components/Sidebar'
import Navbar from './_components/Navbar'

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/crm-login')

  return (
    <div className="bg-[var(--color-surface-container-high)]">
      <div className="flex gap-4 h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="hidden w-[260px] pl-3 pt-3 pb-3 shrink-0 lg:block h-screen sticky top-0 left-0">
          <Sidebar />
        </div>

        {/* Right column: navbar sticky + main en un solo scroll */}
        <div id="crm-main" className="min-w-0 flex-1 overflow-y-auto sticky top-0 right-0 pr-3">
          <div className="sticky top-0 z-10">
            <Navbar />
          </div>
          <main className="flex flex-col gap-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
