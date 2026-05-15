import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { DisconnectButton } from './_components/DisconnectButton'
import { TOK } from '@/app/crm/_lib/ui-tokens'

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
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-on-surface)]">Integraciones</h1>

      <div className="space-y-4">
        {/* Zoom */}
        <div className={`${TOK.panel} flex items-center justify-between p-5`}>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-fixed)] text-sm font-bold text-[var(--color-on-primary-fixed)]">
              Z
            </div>
            <div>
              <p className="font-semibold text-[var(--color-on-surface)]">Zoom</p>
              <p className="text-xs text-[var(--color-on-surface-variant)]">
                {zoomConnected
                  ? `Conectado · Última sync: ${byProvider['ZOOM']?.lastSyncAt ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(byProvider['ZOOM'].lastSyncAt)) : 'nunca'}`
                  : zoomError
                  ? 'Error en la conexión'
                  : 'No conectado'}
              </p>
            </div>
            {zoomConnected && <CheckCircle className="h-5 w-5 text-[var(--color-tertiary)]" />}
            {zoomError && <AlertCircle className="h-5 w-5 text-[var(--color-secondary)]" />}
            {!byProvider['ZOOM'] && <XCircle className="h-5 w-5 text-[var(--color-on-surface-variant)]" />}
          </div>

          <div className="flex gap-2">
            {!zoomConnected ? (
              <a
                href="/api/zoom/oauth/start"
                className={TOK.actionPrimary}
              >
                Conectar
              </a>
            ) : (
              <DisconnectButton provider="ZOOM" />
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
