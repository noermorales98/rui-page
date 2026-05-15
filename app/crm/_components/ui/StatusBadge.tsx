import { Badge } from './Badge'

const CONTACT_STATUS: Record<string, { label: string; variant: 'lime' | 'blue' | 'gray' }> = {
  NEW:       { label: 'Nuevo',      variant: 'lime' },
  QUALIFIED: { label: 'Calificado', variant: 'blue' },
  CLIENT:    { label: 'Cliente',    variant: 'gray' },
}

const SALE_STATUS: Record<string, { label: string; variant: 'lime' | 'blue' | 'gray' | 'amber' | 'red' }> = {
  PAID:      { label: 'Pagada',       variant: 'lime'  },
  PENDING:   { label: 'Pendiente',    variant: 'amber' },
  REFUNDED:  { label: 'Reembolsada',  variant: 'amber' },
  CANCELED:  { label: 'Cancelada',    variant: 'gray'  },
}

const DEAL_STAGE: Record<string, { label: string; variant: 'lime' | 'blue' | 'gray' | 'amber' }> = {
  LEAD:        { label: 'Lead',        variant: 'gray'  },
  DEMO:        { label: 'Demo / Llamada', variant: 'blue' },
  NEGOTIATION: { label: 'Negociación', variant: 'amber' },
  ENROLLED:    { label: 'Inscrito',    variant: 'lime'  },
}

const CAMPAIGN_STATUS: Record<string, { label: string; variant: 'lime' | 'blue' | 'gray' | 'amber' | 'red' }> = {
  DRAFT:    { label: 'Borrador',  variant: 'gray'  },
  SENDING:  { label: 'Enviando', variant: 'blue'  },
  SENT:     { label: 'Enviada',  variant: 'lime'  },
  PARTIAL:  { label: 'Parcial',  variant: 'amber' },
  FAILED:   { label: 'Fallida',  variant: 'red'   },
  ARCHIVED: { label: 'Archivada',variant: 'gray'  },
}

const FORM_STATUS: Record<string, { label: string; variant: 'lime' | 'blue' | 'gray' }> = {
  DRAFT:     { label: 'Borrador',  variant: 'gray' },
  PUBLISHED: { label: 'Publicado', variant: 'lime' },
  ARCHIVED:  { label: 'Archivado', variant: 'gray' },
}

function fallback(status: string) {
  return { label: status, variant: 'gray' as const }
}

export function ContactStatusBadge({ status }: { status: string }) {
  const { label, variant } = CONTACT_STATUS[status] ?? fallback(status)
  return <Badge variant={variant}>{label}</Badge>
}

export function SaleStatusBadge({ status }: { status: string }) {
  const { label, variant } = SALE_STATUS[status] ?? fallback(status)
  return <Badge variant={variant}>{label}</Badge>
}

export function DealStageBadge({ stage }: { stage: string }) {
  const { label, variant } = DEAL_STAGE[stage] ?? fallback(stage)
  return <Badge variant={variant}>{label}</Badge>
}

export function CampaignStatusBadge({ status }: { status: string }) {
  const { label, variant } = CAMPAIGN_STATUS[status] ?? fallback(status)
  return <Badge variant={variant}>{label}</Badge>
}

export function FormStatusBadge({ status }: { status: string }) {
  const { label, variant } = FORM_STATUS[status] ?? fallback(status)
  return <Badge variant={variant}>{label}</Badge>
}
