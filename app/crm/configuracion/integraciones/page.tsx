import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { DisconnectButton } from './_components/DisconnectButton'

export default async function IntegracionesPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/crm')

  const integrations = await prisma.integration.findMany({
    select: { provider: true, status: true, lastSyncAt: true, updatedAt: true },
  })

  const byProvider = Object.fromEntries(integrations.map((i) => [i.provider, i]))

  const zoomConnected = byProvider['ZOOM']?.status === 'ACTIVE'
  const zoomError = byProvider['ZOOM']?.status === 'ERROR'

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Integraciones</h1>

      <div className="space-y-4">
        {/* Zoom */}
        <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
              Z
            </div>
            <div>
              <p className="font-semibold text-gray-900">Zoom</p>
              <p className="text-xs text-gray-500">
                {zoomConnected
                  ? `Conectado · Última sync: ${byProvider['ZOOM']?.lastSyncAt ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(byProvider['ZOOM'].lastSyncAt)) : 'nunca'}`
                  : zoomError
                  ? 'Error en la conexión'
                  : 'No conectado'}
              </p>
            </div>
            {zoomConnected && <CheckCircle className="h-5 w-5 text-green-500" />}
            {zoomError && <AlertCircle className="h-5 w-5 text-yellow-500" />}
            {!byProvider['ZOOM'] && <XCircle className="h-5 w-5 text-gray-300" />}
          </div>

          <div className="flex gap-2">
            {!zoomConnected ? (
              <a
                href="/api/zoom/oauth/start"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Conectar
              </a>
            ) : (
              <DisconnectButton provider="ZOOM" />
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Más integraciones disponibles próximamente: Stripe, SMTP, WhatsApp.
      </p>
    </div>
  )
}
