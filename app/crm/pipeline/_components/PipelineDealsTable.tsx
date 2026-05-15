'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, startTransition } from 'react'
import type { DealStage } from '@prisma/client'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { deleteDeal, moveDeal } from '../actions'
import { CreateDealModal } from './CreateDealModal'
import type { DealWithContact } from './PipelineBoard'
import { DealStageBadge, Dialog, Select, useToast } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

const STAGE_OPTIONS: { value: DealStage; label: string }[] = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'DEMO', label: 'Demo / Llamada' },
  { value: 'NEGOTIATION', label: 'Negociación' },
  { value: 'ENROLLED', label: 'Inscrito' },
]

function formatUpdatedAt(date: Date | string) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

interface Props {
  deals: DealWithContact[]
  canMutate: boolean
  canDelete: boolean
}

export function PipelineDealsTable({ deals, canMutate, canDelete }: Props) {
  const router = useRouter()
  const { error: toastError } = useToast()
  const [editDeal, setEditDeal] = useState<DealWithContact | null>(null)
  const [confirmDeal, setConfirmDeal] = useState<DealWithContact | null>(null)

  function refresh() {
    router.refresh()
  }

  function handleStageChange(deal: DealWithContact, stage: DealStage) {
    if (!canMutate || deal.stage === stage) return
    startTransition(async () => {
      try {
        await moveDeal(deal.id, stage)
        refresh()
      } catch {
        toastError('No se pudo actualizar la etapa.')
      }
    })
  }

  function doDelete() {
    if (!confirmDeal) return
    const id = confirmDeal.id
    setConfirmDeal(null)
    startTransition(async () => {
      try {
        await deleteDeal(id)
        refresh()
      } catch (err) {
        toastError(err instanceof Error ? err.message : 'Error al archivar.')
      }
    })
  }

  if (deals.length === 0) {
    return (
      <div className={TOK.emptyState}>
        <p className={TOK.textStrong}>Sin oportunidades</p>
        <p className={`mt-1 ${TOK.textMuted}`}>Crea una desde «Nueva oportunidad» o cambia a vista Tarjetas.</p>
      </div>
    )
  }

  return (
    <>
      <Dialog
        open={confirmDeal !== null}
        title="¿Archivar oportunidad?"
        description={
          confirmDeal
            ? `Archivar la oportunidad de ${confirmDeal.contact.name}. Se bloqueará si tiene una venta pagada.`
            : undefined
        }
        variant="danger"
        confirmLabel="Archivar"
        onConfirm={doDelete}
        onCancel={() => setConfirmDeal(null)}
      />
      {editDeal ? (
        <CreateDealModal
          deal={editDeal}
          onClose={() => {
            setEditDeal(null)
            router.refresh()
          }}
        />
      ) : null}

      <div className="min-w-0">
        <div className="mb-2 hidden grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_auto] gap-3 px-4 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--color-on-surface-variant)] lg:grid">
          <span>Contacto</span>
          <span>Curso</span>
          <span>Etapa</span>
          <span>Actualizado</span>
          <span className="text-right">Acciones</span>
        </div>

        {deals.map((deal) => (
          <div
            key={deal.id}
            className="mb-2 grid items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] px-4 py-4 transition last:mb-0 hover:bg-[var(--color-surface-container-low)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_auto] lg:items-center"
          >
            <div className="min-w-0">
              <Link href={`/crm/contactos/${deal.contact.id}`} className={TOK.linkAccent}>
                {deal.contact.name}
              </Link>
              <p className={`mt-0.5 truncate text-xs ${TOK.textSubtle}`}>{deal.contact.email}</p>
            </div>
            <div className="min-w-0">
              {deal.courseName ? (
                <p className="truncate text-sm text-[var(--color-on-surface-variant)]">{deal.courseName}</p>
              ) : (
                <p className="text-sm italic text-[var(--color-on-surface-variant)]/75">sin curso</p>
              )}
            </div>
            <div className="min-w-0 max-w-full">
              {canMutate ? (
                <Select
                  value={deal.stage}
                  aria-label="Etapa"
                  onChange={(e) => handleStageChange(deal, e.target.value as DealStage)}
                  className="min-h-9 w-full max-w-full py-2 text-xs"
                >
                  {STAGE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <DealStageBadge stage={deal.stage} />
              )}
            </div>
            <p className="text-xs text-[var(--color-on-surface-variant)] lg:text-sm">{formatUpdatedAt(deal.updatedAt)}</p>
            <div className="flex flex-wrap items-center justify-start gap-1 pt-1 lg:justify-end lg:pt-0">
              <Link
                href={`/crm/pipeline/${deal.id}`}
                className="rounded-lg p-2 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]"
                title="Ver detalle"
              >
                <ExternalLink size={16} strokeWidth={2} />
              </Link>
              {canMutate ? (
                <button
                  type="button"
                  onClick={() => setEditDeal(deal)}
                  className="cursor-pointer rounded-lg border-none bg-transparent p-2 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]"
                  title="Editar"
                >
                  <Pencil size={16} strokeWidth={2} />
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDeal(deal)}
                  className="cursor-pointer rounded-lg border-none bg-transparent p-2 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]"
                  title="Archivar"
                >
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
