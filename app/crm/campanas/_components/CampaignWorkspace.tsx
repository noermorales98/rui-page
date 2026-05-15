'use client'

import { useActionState, useState } from 'react'
import { Eye, MailPlus, Send } from 'lucide-react'
import { createCampaign, previewCampaignRecipients } from '../actions'
import { Tabs } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type FormOption = {
  id: number
  name: string
  status: string
}

type WebinarOption = {
  id: number
  title: string
  date: Date | string
}

type Props = {
  forms: FormOption[]
  webinars: WebinarOption[]
}

const CONTACT_STATUSES = [
  { value: 'NEW', label: 'Nuevo' },
  { value: 'QUALIFIED', label: 'Calificado' },
  { value: 'CLIENT', label: 'Cliente' },
]

const DEAL_STAGES = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'DEMO', label: 'Demo' },
  { value: 'NEGOTIATION', label: 'Negociación' },
  { value: 'ENROLLED', label: 'Inscrito' },
]

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const labelClass = TOK.label

export function CampaignWorkspace({ forms, webinars }: Props) {
  const [activeTab, setActiveTab] = useState('message')
  const [createState, createAction, createPending] = useActionState(createCampaign, null)
  const [previewState, previewAction, previewPending] = useActionState(previewCampaignRecipients, null)
  const tabs = [
    { id: 'message', label: 'Mensaje' },
    { id: 'audience', label: 'Audiencia' },
    { id: 'review', label: 'Revisión' },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-[var(--radius-sm)] bg-[var(--color-on-surface)] p-2 text-[var(--color-surface-container-lowest)]">
          <MailPlus size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-[var(--color-on-surface)]">Nueva campaña</h2>
          <p className={TOK.textMuted}>Define mensaje, audiencia y guarda un borrador antes de enviarlo.</p>
        </div>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-5" />

      <form className="space-y-6">
        <div className={activeTab === 'message' ? 'space-y-5' : 'hidden'}>
          {createState?.error && (
            <p className={TOK.errorBox}>{createState.error}</p>
          )}
          {createState?.message && (
            <p className="rounded-[var(--radius-md)] bg-[var(--color-tertiary-fixed)] px-4 py-3 text-sm text-[var(--color-on-tertiary-fixed)]">
              {createState.message} #{createState.campaignId}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Nombre interno</label>
              <input
                name="name"
                required
                minLength={2}
                placeholder="Lanzamiento mayo"
                className={TOK.inputNative}
              />
            </div>
            <div>
              <label className={labelClass}>Asunto</label>
              <input
                name="subject"
                required
                minLength={3}
                placeholder="Hola {{nombre}}, tenemos una invitacion para ti"
                className={TOK.inputNative}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>Preheader</label>
              <input
                name="previewText"
                placeholder="Texto breve que aparece en inbox"
                className={TOK.inputNative}
              />
            </div>
            <div>
              <label className={labelClass}>Remitente</label>
              <input
                name="fromName"
                placeholder="Rui Machalele"
                className={TOK.inputNative}
              />
            </div>
            <div>
              <label className={labelClass}>Correo remitente</label>
              <input
                name="fromEmail"
                type="email"
                placeholder="hola@tudominio.com"
                className={TOK.inputNative}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Contenido</label>
            <textarea
              name="bodyText"
              required
              minLength={10}
              rows={9}
              placeholder={'Hola {{nombre}},\n\nQueria invitarte a...'}
              className={`${TOK.inputNativeMultiline} leading-6`}
            />
            <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">
              Variables: {'{{nombre}}'}, {'{{email}}'}, {'{{telefono}}'}, {'{{proyecto}}'}.
            </p>
          </div>
        </div>

        <section className={activeTab === 'audience' ? 'space-y-5' : 'hidden'}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Audiencia</h3>
          <div className="mt-4 space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-[var(--color-on-surface)]">
                <input name="audience" value="registered" type="checkbox" defaultChecked className="h-4 w-4 rounded accent-[var(--color-on-surface)]" />
                Contactos registrados
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--color-on-surface)]">
                <input name="audience" value="pipeline_leads" type="checkbox" defaultChecked className="h-4 w-4 rounded accent-[var(--color-on-surface)]" />
                Leads del pipeline
              </label>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Estado del contacto</p>
              <div className="flex flex-wrap gap-2">
                {CONTACT_STATUSES.map((status) => (
                  <label key={status.value} className="rounded-[var(--radius-sm)] bg-[var(--color-surface-container-lowest)] px-3 py-2 text-xs text-[var(--color-on-surface)]">
                    <input name="contactStatuses" value={status.value} type="checkbox" className="mr-2 h-3.5 w-3.5 rounded accent-[var(--color-on-surface)]" />
                    {status.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Etapa del pipeline</p>
              <div className="grid grid-cols-2 gap-2">
                {DEAL_STAGES.map((stage) => (
                  <label key={stage.value} className="rounded-[var(--radius-sm)] bg-[var(--color-surface-container-lowest)] px-3 py-2 text-xs text-[var(--color-on-surface)]">
                    <input name="dealStages" value={stage.value} type="checkbox" className="mr-2 h-3.5 w-3.5 rounded accent-[var(--color-on-surface)]" />
                    {stage.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Proyecto o curso
              </label>
              <input
                name="projectQuery"
                placeholder="Nombre del proyecto"
                className={TOK.inputNative}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Formulario / tipo</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {forms.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-[var(--color-on-surface-variant)]">No hay formularios.</p>
                ) : (
                  forms.map((form) => (
                    <label key={form.id} className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-container-lowest)] px-3 py-2 text-xs text-[var(--color-on-surface)]">
                      <input name="formIds" value={form.id} type="checkbox" className="h-3.5 w-3.5 rounded accent-[var(--color-on-surface)]" />
                      <span className="truncate">{form.name}</span>
                      <span className="ml-auto text-[10px] text-[var(--color-on-surface-variant)]">{form.status}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Webinar</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {webinars.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-[var(--color-on-surface-variant)]">No hay webinars.</p>
                ) : (
                  webinars.map((webinar) => (
                    <label key={webinar.id} className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-container-lowest)] px-3 py-2 text-xs text-[var(--color-on-surface)]">
                      <input name="webinarIds" value={webinar.id} type="checkbox" className="h-3.5 w-3.5 rounded accent-[var(--color-on-surface)]" />
                      <span className="min-w-0 flex-1 truncate">{webinar.title}</span>
                      <span className="text-[10px] text-[var(--color-on-surface-variant)]">{formatDate(webinar.date)}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={activeTab === 'review' ? 'space-y-5' : 'hidden'}>
          {previewState?.error && (
            <p className={TOK.errorBox}>{previewState.error}</p>
          )}
          {previewState?.count !== undefined && (
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-container-lowest)] p-4">
              <p className="text-sm font-semibold text-[var(--color-on-surface)]">{previewState.count} destinatarios</p>
              <p className="mt-1 text-xs text-[var(--color-on-surface-variant)]">{previewState.audienceLabel}</p>
              {previewState.sample && previewState.sample.length > 0 && (
                <div className="mt-3 space-y-1">
                  {previewState.sample.map((contact) => (
                    <p key={contact.id} className="truncate text-xs text-[var(--color-on-surface-variant)]">
                      {contact.name} · {contact.email}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="submit"
              formAction={previewAction}
              disabled={previewPending}
              className={TOK.actionSecondary}
            >
              <Eye size={15} />
              {previewPending ? 'Calculando...' : 'Vista previa'}
            </button>
            <button
              type="submit"
              formAction={createAction}
              disabled={createPending}
              className={TOK.actionPrimary}
            >
              <Send size={15} />
              {createPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </section>
      </form>
    </div>
  )
}
