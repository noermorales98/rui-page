import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import type { AuditAction } from '@prisma/client'

interface Props {
  searchParams: Promise<{ page?: string; entity?: string; action?: string }>
}

const PAGE_SIZE = 50

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Crear',
  UPDATE: 'Actualizar',
  DELETE: 'Eliminar',
  STATUS_CHANGE: 'Cambio estado',
  STAGE_CHANGE: 'Cambio etapa',
}

const dateFmt = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export default async function AuditLogPage({ searchParams }: Props) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/crm/configuracion')

  const query = await searchParams
  const page = Math.max(1, Number(query.page) || 1)
  const entityFilter = query.entity?.trim() || undefined
  const actionFilter = query.action?.trim() || undefined

  const where = {
    ...(entityFilter ? { entityType: entityFilter } : {}),
    ...(actionFilter ? { action: { equals: actionFilter as AuditAction } } : {}),
  }

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const entityTypes = await prisma.auditLog.findMany({
    distinct: ['entityType'],
    select: { entityType: true },
    orderBy: { entityType: 'asc' },
  })

  function pageHref(p: number) {
    const params = new URLSearchParams()
    if (entityFilter) params.set('entity', entityFilter)
    if (actionFilter) params.set('action', actionFilter)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">Auditoría</h1>
        <p className={TOK.textMuted}>{total} registros</p>
      </div>

      <form method="GET" className="flex flex-wrap gap-3">
        <select
          name="entity"
          defaultValue={entityFilter ?? ''}
          className={`${TOK.inputNative} w-auto`}
        >
          <option value="">Todas las entidades</option>
          {entityTypes.map(({ entityType }) => (
            <option key={entityType} value={entityType}>{entityType}</option>
          ))}
        </select>
        <select
          name="action"
          defaultValue={actionFilter ?? ''}
          className={`${TOK.inputNative} w-auto`}
        >
          <option value="">Todas las acciones</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button type="submit" className={TOK.actionSecondary}>Filtrar</button>
        {(entityFilter || actionFilter) && (
          <Link href="/crm/configuracion/auditlog" className={TOK.actionSecondary}>Limpiar</Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
              {['Fecha', 'Actor', 'Entidad', 'ID', 'Acción'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-outline-variant)]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--color-on-surface-variant)]">
                  Sin registros
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container-low)]">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--color-on-surface-variant)]">
                    {dateFmt.format(new Date(row.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-on-surface)]">
                    {row.actor?.name ?? row.actor?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-on-surface-variant)]">{row.entityType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-on-surface-variant)]">{row.entityId}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-[var(--radius-sm)] bg-[var(--color-surface-container-high)] px-2 py-0.5 text-xs font-medium text-[var(--color-on-surface)]">
                      {ACTION_LABELS[row.action] ?? row.action}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className={TOK.actionSecondary}>Anterior</Link>
          )}
          <span className="text-sm text-[var(--color-on-surface-variant)]">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link href={pageHref(page + 1)} className={TOK.actionSecondary}>Siguiente</Link>
          )}
        </div>
      )}
    </div>
  )
}
