import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { isZoomConfigured } from '@/lib/integrations/zoom'

export default async function IntegracionesPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/crm')

  const zoomConfigured = isZoomConfigured()

  const integration = zoomConfigured
    ? await prisma.integration.findUnique({
        where: { provider: 'ZOOM' },
        select: { status: true, lastSyncAt: true },
      })
    : null

  const zoomActive = integration?.status === 'ACTIVE'
  const zoomError = integration?.status === 'ERROR'

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-on-surface)]">Integraciones</h1>

      <div className="space-y-4">
        {/* Zoom */}
        <div className={`${TOK.panel} flex items-center justify-between p-5`}>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2D8CFF] text-sm font-bold text-white">
              Z
            </div>
            <div>
              <p className="font-semibold text-[var(--color-on-surface)]">Zoom</p>
              <p className="text-xs text-[var(--color-on-surface-variant)]">
                {!zoomConfigured
                  ? 'Credenciales no configuradas en .env'
                  : zoomActive
                  ? `Conectado · Última actividad: ${integration?.lastSyncAt ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(integration.lastSyncAt)) : 'pendiente'}`
                  : zoomError
                  ? 'Error al conectar — revisa las credenciales'
                  : 'Credenciales configuradas · pendiente de primera llamada'}
              </p>
            </div>
            {zoomActive && <CheckCircle className="h-5 w-5 text-green-500" />}
            {zoomError && <AlertCircle className="h-5 w-5 text-[var(--color-error)]" />}
            {!zoomConfigured && <XCircle className="h-5 w-5 text-[var(--color-on-surface-variant)]" />}
          </div>

          <div className="text-right">
            {zoomConfigured ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                Server-to-Server OAuth
              </span>
            ) : (
              <p className="text-xs text-[var(--color-on-surface-variant)]">
                Agrega <code className="font-mono">ZOOM_ACCOUNT_ID</code>,{' '}
                <code className="font-mono">ZOOM_CLIENT_ID</code> y{' '}
                <code className="font-mono">ZOOM_CLIENT_SECRET</code> al .env
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--color-on-surface-variant)]">
        Más integraciones disponibles próximamente: Stripe, SMTP, WhatsApp.
      </p>
    </div>
  )
}
