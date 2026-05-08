import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Sidebar from './_components/Sidebar'
import Navbar from './_components/Navbar'

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/crm-login')

  return (
    <div className="min-h-screen bg-[#edeef0] p-3 sm:p-5">
      <div className="grid min-h-[calc(100vh-24px)] gap-4 lg:min-h-[calc(100vh-40px)] lg:grid-cols-[260px_minmax(0,1fr)] lg:grid-rows-[80px_minmax(0,1fr)]">
        {/* Sidebar spans both rows */}
        <div className="lg:col-start-1 lg:row-span-2">
          <Sidebar />
        </div>

        {/* Navbar: col 2, row 1 */}
        <div className="lg:col-start-2 lg:row-start-1">
          <Navbar />
        </div>

        {/* Main content: col 2, row 2 */}
        <main className="min-w-0 lg:col-start-2 lg:row-start-2">
          <div className="flex flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
