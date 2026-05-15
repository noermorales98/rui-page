import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export default async function SegmentosPage() {
  const segments = await prisma.segment.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, description: true, isDynamic: true, createdAt: true },
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">Segmentos</h1>
          <p className={TOK.textMuted}>{segments.length} segmentos</p>
        </div>
        <Link href="/crm/campanas/segmentos/nuevo" className={TOK.actionPrimary}>
          <Plus size={16} />
          Nuevo segmento
        </Link>
      </div>

      {segments.length === 0 ? (
        <div className={TOK.emptyState}>
          <p className={TOK.textMuted}>Crea tu primer segmento de audiencia.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Tipo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-outline-variant)]">
              {segments.map((s) => (
                <tr key={s.id} className="bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container-low)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-on-surface)]">{s.name}</td>
                  <td className="px-4 py-3 text-[var(--color-on-surface-variant)]">{s.description ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-on-surface-variant)]">{s.isDynamic ? 'Dinámico' : 'Estático'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/crm/campanas/segmentos/${s.id}`} className={TOK.linkAccent}>Editar</Link>
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
