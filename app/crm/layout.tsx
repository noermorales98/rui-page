import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Sidebar from './_components/Sidebar'
import Navbar from './_components/Navbar'

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/crm-login')

  return (
    <div className="min-h-screen bg-[#edeef0] p-5">
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: '260px 1fr',
          gridTemplateRows: '68px 1fr',
          minHeight: 'calc(100vh - 40px)',
        }}
      >
        {/* Sidebar spans both rows */}
        <div style={{ gridColumn: '1', gridRow: '1 / 3' }}>
          <Sidebar />
        </div>

        {/* Navbar: col 2, row 1 */}
        <div style={{ gridColumn: '2', gridRow: '1' }}>
          <Navbar />
        </div>

        {/* Main content: col 2, row 2 */}
        <main style={{ gridColumn: '2', gridRow: '2' }} className="min-w-0">
          <div className="flex flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
