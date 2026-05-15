import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Sidebar from './_components/Sidebar'
import Navbar from './_components/Navbar'
import { ToastProvider } from '@/app/crm/_components/ui/Toast'

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/crm-login')

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--color-surface-container-high)]">
        <div className="flex min-w-0 gap-4">
          {/* Sidebar: sticky + alto viewport, sin estirar con el main (self-start) */}
          <div className="sticky top-0 z-10 hidden h-dvh w-[260px] shrink-0 flex-col py-3 pl-3 lg:flex">
            <div className="flex min-h-0 flex-1 flex-col">
              <Sidebar />
            </div>
          </div>

          {/* Right column: navbar sticky + main en scroll de página */}
          <div id="crm-main" className="min-w-0 flex-1 pr-3">
            <div className="sticky top-0 z-10">
              <Navbar />
            </div>
            <main className="flex min-w-0 flex-col gap-6">{children}</main>
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
