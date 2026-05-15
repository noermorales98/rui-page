import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export default async function TemplatesPage() {
  const templates = await prisma.campaignTemplate.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, channel: true, subject: true, createdAt: true },
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">Plantillas</h1>
          <p className={TOK.textMuted}>{templates.length} plantillas</p>
        </div>
        <Link href="/crm/campanas/templates/nueva" className={TOK.actionPrimary}>
          <Plus size={16} />
          Nueva plantilla
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className={TOK.emptyState}>
          <p className={TOK.textMuted}>Crea tu primera plantilla de campaña.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Canal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Asunto</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-outline-variant)]">
              {templates.map((t) => (
                <tr key={t.id} className="bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container-low)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-on-surface)]">{t.name}</td>
                  <td className="px-4 py-3 text-[var(--color-on-surface-variant)]">{t.channel}</td>
                  <td className="px-4 py-3 text-[var(--color-on-surface-variant)]">{t.subject ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/crm/campanas/templates/${t.id}`} className={TOK.linkAccent}>Editar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
