'use client'

import { useState, useActionState } from 'react'
import { Eye, MailPlus, Send } from 'lucide-react'
import { createCampaign, previewCampaignRecipients } from '../actions'

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

const inputClass =
  'w-full rounded-full px-5 py-2.5 border border-[#f2f2f2] bg-white focus:border-[#9ca3af] outline-none transition text-sm'
const textareaClass =
  'w-full rounded-2xl px-5 py-2.5 border border-[#f2f2f2] bg-white focus:border-[#9ca3af] outline-none transition text-sm leading-6'
const labelClass = 'block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5'

const tabBtn = (active: boolean) =>
  `-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
    active
      ? 'border-[var(--color-on-surface)] text-[var(--color-on-surface)]'
      : 'border-transparent text-[var(--color-on-surface-variant)] hover:border-[var(--color-outline-variant)] hover:text-[var(--color-on-surface)]'
  }`

export function CampaignWorkspace({ forms, webinars }: Props) {
  const [activeTab, setActiveTab] = useState<'mensaje' | 'audiencia'>('mensaje')
  const [createState, createAction, createPending] = useActionState(createCampaign, null)
  const [previewState, previewAction, previewPending] = useActionState(previewCampaignRecipients, null)

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-xl bg-[var(--color-on-surface)] p-2 text-[var(--color-surface-container-lowest)]">
          <MailPlus size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-[var(--color-on-surface)]">Nueva campaña</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)]">Define mensaje, audiencia y guarda un borrador antes de enviarlo.</p>
        </div>
      </div>

      {/* Mobile tab nav — hidden on lg */}
      <nav
        role="tablist"
        className="mb-6 flex gap-0 border-b border-[var(--color-outline-variant)] lg:hidden"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'mensaje'}
          onClick={() => setActiveTab('mensaje')}
          className={tabBtn(activeTab === 'mensaje')}
        >
          Mensaje
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'audiencia'}
          onClick={() => setActiveTab('audiencia')}
          className={tabBtn(activeTab === 'audiencia')}
        >
          Audiencia
        </button>
      </nav>

      <form className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Mensaje panel — hidden on mobile when audiencia tab active */}
        <div className={`space-y-5 pr-0 lg:block lg:pr-6 ${activeTab === 'audiencia' ? 'hidden' : ''}`}>
          {createState?.error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{createState.error}</p>
          )}
          {createState?.message && (
            <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
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
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Asunto</label>
              <input
                name="subject"
                required
                minLength={3}
                placeholder="Hola {{nombre}}, tenemos una invitacion para ti"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>Preheader</label>
              <input
                name="previewText"
                placeholder="Texto breve que aparece en inbox"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Remitente</label>
              <input
                name="fromName"
                placeholder="Rui Machalele"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Correo remitente</label>
              <input
                name="fromEmail"
                type="email"
                placeholder="hola@tudominio.com"
                className={inputClass}
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
              className={textareaClass}
            />
            <p className="mt-1 text-xs text-[#b0b0b0]">
              Variables: {'{{nombre}}'}, {'{{email}}'}, {'{{telefono}}'}, {'{{proyecto}}'}.
            </p>
          </div>
        </div>

        {/* Audiencia panel */}
        <aside className={`border-[#e8e8e8] lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:border-l lg:pl-6 ${activeTab === 'mensaje' ? 'hidden lg:block' : ''}`}>
          <h3 className="text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider">Audiencia</h3>
          <div className="mt-4 space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-[#080808]">
                <input name="audience" value="registered" type="checkbox" defaultChecked className="h-4 w-4 rounded border-[#f2f2f2] accent-[#080808]" />
                Contactos registrados
              </label>
              <label className="flex items-center gap-2 text-sm text-[#080808]">
                <input name="audience" value="pipeline_leads" type="checkbox" defaultChecked className="h-4 w-4 rounded border-[#f2f2f2] accent-[#080808]" />
                Leads del pipeline
              </label>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">Estado del contacto</p>
              <div className="flex flex-wrap gap-2">
                {CONTACT_STATUSES.map((status) => (
                  <label key={status.value} className="rounded-xl border border-[#e8e8e8] bg-white px-3 py-2 text-xs text-[#080808]">
                    <input name="contactStatuses" value={status.value} type="checkbox" className="mr-2 h-3.5 w-3.5 rounded border-[#f2f2f2] accent-[#080808]" />
                    {status.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">Etapa del pipeline</p>
              <div className="grid grid-cols-2 gap-2">
                {DEAL_STAGES.map((stage) => (
                  <label key={stage.value} className="rounded-xl border border-[#e8e8e8] bg-white px-3 py-2 text-xs text-[#080808]">
                    <input name="dealStages" value={stage.value} type="checkbox" className="mr-2 h-3.5 w-3.5 rounded border-[#f2f2f2] accent-[#080808]" />
                    {stage.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Proyecto o curso</label>
              <input
                name="projectQuery"
                placeholder="Nombre del proyecto"
                className={inputClass}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">Formulario / tipo</p>
              <div className="max-h-32 space-y-2 overflow-y-auto rounded-2xl border border-[#e8e8e8] bg-white p-2">
                {forms.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-[#b0b0b0]">No hay formularios.</p>
                ) : (
                  forms.map((form) => (
                    <label key={form.id} className="flex items-center gap-2 text-xs text-[#080808]">
                      <input name="formIds" value={form.id} type="checkbox" className="h-3.5 w-3.5 rounded border-[#f2f2f2] accent-[#080808]" />
                      <span className="truncate">{form.name}</span>
                      <span className="ml-auto text-[10px] text-[#b0b0b0]">{form.status}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">Webinar</p>
              <div className="max-h-32 space-y-2 overflow-y-auto rounded-2xl border border-[#e8e8e8] bg-white p-2">
                {webinars.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-[#b0b0b0]">No hay webinars.</p>
                ) : (
                  webinars.map((webinar) => (
                    <label key={webinar.id} className="flex items-center gap-2 text-xs text-[#080808]">
                      <input name="webinarIds" value={webinar.id} type="checkbox" className="h-3.5 w-3.5 rounded border-[#f2f2f2] accent-[#080808]" />
                      <span className="min-w-0 flex-1 truncate">{webinar.title}</span>
                      <span className="text-[10px] text-[#b0b0b0]">{formatDate(webinar.date)}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {previewState?.error && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{previewState.error}</p>
          )}
          {previewState?.count !== undefined && (
            <div className="mt-4 rounded-2xl border border-[#e8e8e8] bg-white p-3">
              <p className="text-sm font-semibold text-[#080808]">{previewState.count} destinatarios</p>
              <p className="mt-1 text-xs text-[#8a8a8a]">{previewState.audienceLabel}</p>
              {previewState.sample && previewState.sample.length > 0 && (
                <div className="mt-3 space-y-1">
                  {previewState.sample.map((contact) => (
                    <p key={contact.id} className="truncate text-xs text-[#555]">
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
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-3 py-2.5 text-sm font-semibold text-[#080808] hover:bg-[#f7f8fa] transition border-none cursor-pointer font-sans disabled:opacity-50"
            >
              <Eye size={15} />
              {previewPending ? 'Calculando...' : 'Preview'}
            </button>
            <button
              type="submit"
              formAction={createAction}
              disabled={createPending}
              className="bg-[var(--color-on-surface)] text-[var(--color-surface-container-lowest)] rounded-full px-6 py-3 text-sm font-semibold hover:opacity-90 transition border-none cursor-pointer font-sans disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Send size={15} />
              {createPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </aside>
      </form>
    </div>
  )
}
