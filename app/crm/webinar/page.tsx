import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { LiveCount } from './_components/LiveCount'

const WEBINAR_PUBLIC_ID = parseInt(process.env.WEBINAR_PUBLIC_ID ?? '1')

const PAIN_LABELS: Record<string, string> = {
  claridad: 'Falta de claridad',
  direccion: 'Falta de dirección',
  motivacion: 'Falta de motivación',
}

function MetricCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className={`${TOK.panel} p-5`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">{label}</p>
      <div className="mt-2 text-3xl font-bold tabular-nums text-[var(--color-on-surface)]">{value}</div>
      {sub && <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">{sub}</p>}
    </div>
  )
}

export default async function WebinarDashboardPage() {
  const webinar = await prisma.webinar.findUnique({
    where: { id: WEBINAR_PUBLIC_ID },
    select: { title: true, date: true, link: true },
  })

  // Metrics
  const [
    totalRegistros,
    whatsappClicks,
    videoPlays,
    accesoEntries,
    salaEntries,
    painEvents,
    recentRegistros,
    accesoNames,
  ] = await Promise.all([
    prisma.webinarRegistration.count({ where: { webinarId: WEBINAR_PUBLIC_ID } }),
    prisma.webinarEvent.count({ where: { webinarId: WEBINAR_PUBLIC_ID, type: 'WHATSAPP_CLICK' } }),
    prisma.webinarEvent.count({ where: { webinarId: WEBINAR_PUBLIC_ID, type: 'VIDEO_PLAY' } }),
    prisma.webinarEvent.count({ where: { webinarId: WEBINAR_PUBLIC_ID, type: 'ACCESO_ENTRY' } }),
    prisma.webinarEvent.count({ where: { webinarId: WEBINAR_PUBLIC_ID, type: 'SALA_ENTRY' } }),
    prisma.webinarEvent.findMany({
      where: { webinarId: WEBINAR_PUBLIC_ID, type: 'PAIN_SELECTED' },
      select: { meta: true },
    }),
    prisma.webinarRegistration.findMany({
      where: { webinarId: WEBINAR_PUBLIC_ID },
      include: { contact: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.webinarEvent.findMany({
      where: { webinarId: WEBINAR_PUBLIC_ID, type: 'ACCESO_ENTRY' },
      select: { meta: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  // Pain distribution
  const painCount: Record<string, number> = {}
  for (const ev of painEvents) {
    const meta = ev.meta as { pain?: string } | null
    const pain = meta?.pain ?? 'desconocido'
    painCount[pain] = (painCount[pain] ?? 0) + 1
  }

  // Conversion rates
  const pctWhatsapp = totalRegistros > 0 ? Math.round((whatsappClicks / totalRegistros) * 100) : 0
  const pctAcceso = totalRegistros > 0 ? Math.round((accesoEntries / totalRegistros) * 100) : 0
  const pctSala = totalRegistros > 0 ? Math.round((salaEntries / totalRegistros) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">Webinar</h1>
        {webinar && (
          <p className={`mt-1.5 ${TOK.sectionSubtitle}`}>
            {webinar.title} · {new Date(webinar.date).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
        {webinar && !webinar.link && (
          <p className="mt-2 text-sm text-[var(--color-error)]">
            ⚠ La sala no tiene link configurado. Agrégalo en Configuración del webinar.
          </p>
        )}
      </div>

      {/* Funnel metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Registros" value={totalRegistros} sub="/webinar" />
        <MetricCard label="WhatsApp" value={whatsappClicks} sub={`${pctWhatsapp}% del total`} />
        <MetricCard label="Video visto" value={videoPlays} sub="/webinar/gracias" />
        <MetricCard label="Acceso" value={accesoEntries} sub={`${pctAcceso}% asistió`} />
        <MetricCard label="Sala" value={salaEntries} sub={`${pctSala}% en la sala`} />
        <div className={`${TOK.panel} p-5`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">En vivo ahora</p>
          <div className="mt-2">
            <LiveCount />
          </div>
          <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">sesiones activas</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pain survey results */}
        <div className={`${TOK.panel} p-5`}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-on-surface)]">
            Respuestas al survey — «¿Qué te duele más?»
          </h2>
          {painEvents.length === 0 ? (
            <p className="text-sm text-[var(--color-on-surface-variant)]">Sin respuestas todavía.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(painCount)
                .sort(([, a], [, b]) => b - a)
                .map(([pain, count]) => {
                  const pct = Math.round((count / painEvents.length) * 100)
                  return (
                    <div key={pain}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--color-on-surface)]">{PAIN_LABELS[pain] ?? pain}</span>
                        <span className="font-semibold tabular-nums text-[var(--color-on-surface)]">{count} ({pct}%)</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--color-surface-container-high)]">
                        <div
                          className="h-1.5 rounded-full bg-[var(--color-primary)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              <p className="pt-1 text-xs text-[var(--color-on-surface-variant)]">
                Total respuestas: {painEvents.length}
              </p>
            </div>
          )}
        </div>

        {/* Acceso entries with names */}
        <div className={`${TOK.panel} p-5`}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-on-surface)]">
            Quiénes pasaron por la antesala ({accesoNames.length})
          </h2>
          {accesoNames.length === 0 ? (
            <p className="text-sm text-[var(--color-on-surface-variant)]">Sin entradas todavía.</p>
          ) : (
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {accesoNames.map((ev, i) => {
                const meta = ev.meta as { name?: string } | null
                return (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--color-surface-container-lowest)]">
                    <span className="text-sm text-[var(--color-on-surface)]">{meta?.name ?? '—'}</span>
                    <span className="text-xs text-[var(--color-on-surface-variant)]">
                      {new Date(ev.createdAt).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Registros table */}
      <div className={`${TOK.panel} p-5`}>
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-on-surface)]">
          Últimos registros ({totalRegistros} total)
        </h2>
        {recentRegistros.length === 0 ? (
          <p className="text-sm text-[var(--color-on-surface-variant)]">Sin registros todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-outline-variant)] text-left text-xs uppercase tracking-wide text-[var(--color-on-surface-variant)]">
                  <th className="pb-2 pr-4 font-semibold">Nombre</th>
                  <th className="pb-2 pr-4 font-semibold">Email</th>
                  <th className="pb-2 pr-4 font-semibold">Teléfono</th>
                  <th className="pb-2 font-semibold">Registros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)]">
                {recentRegistros.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--color-surface-container-lowest)]">
                    <td className="py-2 pr-4 font-medium text-[var(--color-on-surface)]">{r.contact.name}</td>
                    <td className="py-2 pr-4 text-[var(--color-on-surface-variant)]">{r.contact.email}</td>
                    <td className="py-2 pr-4 text-[var(--color-on-surface-variant)]">{r.contact.phone ?? '—'}</td>
                    <td className="py-2 text-center font-semibold text-[var(--color-on-surface)]">{r.registrationCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
