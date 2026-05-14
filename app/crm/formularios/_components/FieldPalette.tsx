'use client'

import { useState } from 'react'
import type { CrmFormFieldType } from '@prisma/client'
import {
  Calendar,
  CalendarClock,
  Clock,
  Code2,
  LayoutGrid,
  Mail,
  Phone,
  Plus,
  TextCursorInput,
  UserRound,
} from 'lucide-react'
import { AddFieldDialog } from './AddFieldDialog'
import { ALL_PALETTE_PRESETS, CRM_PALETTE_PRESETS, HTML_PALETTE_PRESETS } from '../_lib/palette-presets'
import type { PalettePreset } from '../_lib/palette-presets'

interface Props {
  formId: number
}

const CRM_ICONS: Record<CrmFormFieldType, React.ComponentType<{ size?: number }>> = {
  SHORT_TEXT: UserRound,
  FULL_NAME: TextCursorInput,
  PHONE: Phone,
  PHONE_WITH_COUNTRY: Phone,
  EMAIL: Mail,
  CUSTOM_DATE: Calendar,
  CUSTOM_TIME: Clock,
  CUSTOM_DATETIME: CalendarClock,
  HTML_INPUT: Code2,
}

function PresetRow({
  preset,
  onPick,
}: {
  preset: PalettePreset
  onPick: () => void
}) {
  const Icon =
    preset.group === 'html' ? LayoutGrid : CRM_ICONS[preset.defaults.type as CrmFormFieldType] ?? LayoutGrid
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 hover:border-indigo-200 hover:bg-indigo-50"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <Icon size={16} className="shrink-0 text-gray-500" />
          <span className="font-medium text-gray-900">{preset.title}</span>
        </span>
        {preset.subtitle && <span className="mt-0.5 block truncate pl-7 text-xs text-gray-500">{preset.subtitle}</span>}
      </span>
      <Plus size={14} className="shrink-0 text-gray-400" />
    </button>
  )
}

export function FieldPalette({ formId }: Props) {
  const [dialogPreset, setDialogPreset] = useState<PalettePreset | null>(null)
  const [dialogKey, setDialogKey] = useState(0)

  return (
    <>
      <aside className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Inputs</h2>
        <p className="mb-4 text-xs leading-relaxed text-gray-500">
          Elige un tipo: podrás ajustar etiqueta, clave interna, placeholder, ayuda y obligatorio antes de crear el
          campo.
        </p>

        <div className="mb-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Contacto y CRM</h3>
          <div className="space-y-2">
            {CRM_PALETTE_PRESETS.map((preset) => (
              <PresetRow
                key={preset.id}
                preset={preset}
                onPick={() => {
                  setDialogPreset(preset)
                  setDialogKey((k) => k + 1)
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">HTML personalizado</h3>
          <div className="space-y-2">
            {HTML_PALETTE_PRESETS.map((preset) => (
              <PresetRow
                key={preset.id}
                preset={preset}
                onPick={() => {
                  setDialogPreset(preset)
                  setDialogKey((k) => k + 1)
                }}
              />
            ))}
          </div>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
          Total: {ALL_PALETTE_PRESETS.length} plantillas. Los campos HTML guardan la forma del control en{' '}
          <code className="rounded bg-gray-100 px-1">config.html</code>.
        </p>
      </aside>

      {dialogPreset && (
        <AddFieldDialog
          key={dialogKey}
          formId={formId}
          preset={dialogPreset}
          onClose={() => setDialogPreset(null)}
        />
      )}
    </>
  )
}
