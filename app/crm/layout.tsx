import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Sidebar from './_components/Sidebar'

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/crm-login')

  return (
    <div className="flex min-h-screen" style={{ background: '#f8f9fb' }}>
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
