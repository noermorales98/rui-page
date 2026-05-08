'use client'

import { useActionState } from 'react'
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

export function CampaignWorkspace({ forms, webinars }: Props) {
  const [createState, createAction, createPending] = useActionState(createCampaign, null)
  const [previewState, previewAction, previewPending] = useActionState(previewCampaignRecipients, null)

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
            <MailPlus size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Nueva campaña</h2>
            <p className="text-sm text-gray-500">Define mensaje, audiencia y guarda un borrador antes de enviarlo.</p>
          </div>
        </div>
      </div>

      <form className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5 p-6">
          {createState?.error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{createState.error}</p>
          )}
          {createState?.message && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              {createState.message} #{createState.campaignId}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nombre interno</label>
              <input
                name="name"
                required
                minLength={2}
                placeholder="Lanzamiento mayo"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Asunto</label>
              <input
                name="subject"
                required
                minLength={3}
                placeholder="Hola {{nombre}}, tenemos una invitacion para ti"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Preheader</label>
              <input
                name="previewText"
                placeholder="Texto breve que aparece en inbox"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Remitente</label>
              <input
                name="fromName"
                placeholder="Rui Machalele"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Correo remitente</label>
              <input
                name="fromEmail"
                type="email"
                placeholder="hola@tudominio.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Contenido</label>
            <textarea
              name="bodyText"
              required
              minLength={10}
              rows={9}
              placeholder={'Hola {{nombre}},\n\nQueria invitarte a...'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Variables: {'{{nombre}}'}, {'{{email}}'}, {'{{telefono}}'}, {'{{proyecto}}'}.
            </p>
          </div>
        </div>

        <aside className="border-t border-gray-200 bg-gray-50 p-6 lg:border-l lg:border-t-0">
          <h3 className="text-sm font-semibold text-gray-900">Audiencia</h3>
          <div className="mt-4 space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input name="audience" value="registered" type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                Contactos registrados
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input name="audience" value="pipeline_leads" type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                Leads del pipeline
              </label>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Estado del contacto</p>
              <div className="flex flex-wrap gap-2">
                {CONTACT_STATUSES.map((status) => (
                  <label key={status.value} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                    <input name="contactStatuses" value={status.value} type="checkbox" className="mr-2 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600" />
                    {status.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Etapa del pipeline</p>
              <div className="grid grid-cols-2 gap-2">
                {DEAL_STAGES.map((stage) => (
                  <label key={stage.value} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                    <input name="dealStages" value={stage.value} type="checkbox" className="mr-2 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600" />
                    {stage.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Proyecto o curso
              </label>
              <input
                name="projectQuery"
                placeholder="Nombre del proyecto"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Formulario / tipo</p>
              <div className="max-h-32 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2">
                {forms.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-gray-400">No hay formularios.</p>
                ) : (
                  forms.map((form) => (
                    <label key={form.id} className="flex items-center gap-2 text-xs text-gray-700">
                      <input name="formIds" value={form.id} type="checkbox" className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600" />
                      <span className="truncate">{form.name}</span>
                      <span className="ml-auto text-[10px] text-gray-400">{form.status}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Webinar</p>
              <div className="max-h-32 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2">
                {webinars.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-gray-400">No hay webinars.</p>
                ) : (
                  webinars.map((webinar) => (
                    <label key={webinar.id} className="flex items-center gap-2 text-xs text-gray-700">
                      <input name="webinarIds" value={webinar.id} type="checkbox" className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600" />
                      <span className="min-w-0 flex-1 truncate">{webinar.title}</span>
                      <span className="text-[10px] text-gray-400">{formatDate(webinar.date)}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {previewState?.error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{previewState.error}</p>
          )}
          {previewState?.count !== undefined && (
            <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <p className="text-sm font-semibold text-indigo-900">{previewState.count} destinatarios</p>
              <p className="mt-1 text-xs text-indigo-700">{previewState.audienceLabel}</p>
              {previewState.sample && previewState.sample.length > 0 && (
                <div className="mt-3 space-y-1">
                  {previewState.sample.map((contact) => (
                    <p key={contact.id} className="truncate text-xs text-indigo-800">
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
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <Eye size={15} />
              {previewPending ? 'Calculando...' : 'Preview'}
            </button>
            <button
              type="submit"
              formAction={createAction}
              disabled={createPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
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
