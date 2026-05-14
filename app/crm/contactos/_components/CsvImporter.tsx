'use client'

import { Upload } from 'lucide-react'
import { useState, useActionState } from 'react'
import { importContactsFile } from '../actions'
import { Button } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

type Row = { name: string; email: string; phone?: string; source?: string }

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim())

  const nameIdx = headers.findIndex((h) => h === 'nombre' || h === 'name')
  const emailIdx = headers.findIndex((h) => h === 'email')
  const phoneIdx = headers.findIndex((h) => h === 'telefono' || h === 'phone' || h === 'teléfono')
  const sourceIdx = headers.findIndex((h) => h === 'fuente' || h === 'source')

  if (nameIdx === -1 || emailIdx === -1) return []

  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line)
    return {
      name: cols[nameIdx]?.trim() ?? '',
      email: cols[emailIdx]?.trim() ?? '',
      phone: phoneIdx >= 0 ? (cols[phoneIdx]?.trim() || undefined) : undefined,
      source: sourceIdx >= 0 ? cols[sourceIdx]?.trim().toUpperCase() : undefined,
    }
  })
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result.map((field) => {
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1).replace(/""/g, '"')
    }
    return field
  })
}

interface CsvImporterProps {
  /** Si true, muestra título y botón de subida compacto (página dedicada). */
  standalone?: boolean
}

export function CsvImporter({ standalone = false }: CsvImporterProps) {
  const [rows, setRows] = useState<Row[]>([])
  const [submitted, setSubmitted] = useState(false)

  const [state, formAction, isPending] = useActionState(importContactsFile, null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setRows([])
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setRows(parseCsv(text))
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      {standalone && (
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-on-surface)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)]">
            <Upload size={17} strokeWidth={1.7} />
          </span>
          Archivo CSV
        </div>
      )}

      <p className={`${TOK.textMuted} leading-6`}>
        El archivo se procesa en el servidor (UTF-8 o Latin-1, separador <strong>,</strong> o <strong>;</strong>).
        Cabecera con nombre/email obligatorios. Máximo 5 MB.
      </p>

      <form
        action={(fd) => {
          setSubmitted(true)
          formAction(fd)
        }}
        className="space-y-4"
      >
        <input
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          onChange={handleFileChange}
          className="block w-full rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-3 text-sm text-[var(--color-on-surface-variant)] file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-[var(--color-secondary-container)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-on-secondary-container)] hover:file:brightness-95"
        />

        {rows.length > 0 && (
          <div>
            <p className={`mb-2 ${TOK.textStrong}`}>
              Vista previa (cliente): primeras 5 filas de {rows.length} detectadas.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-[var(--color-outline-variant)]">
              <table className="min-w-full text-xs">
                <thead className="bg-[var(--color-surface-container)]">
                  <tr>
                    {['Nombre', 'Email', 'Teléfono', 'Fuente'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-[var(--color-on-surface-variant)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-outline-variant)]">
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-[var(--color-on-surface)]">{row.name}</td>
                      <td className="px-3 py-2 text-[var(--color-on-surface)]">{row.email}</td>
                      <td className="px-3 py-2 text-[var(--color-on-surface-variant)]">{row.phone ?? '—'}</td>
                      <td className="px-3 py-2 text-[var(--color-on-surface-variant)]">{row.source ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {state && submitted && (
          <div className="rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-secondary-container)]/25 px-4 py-3 text-sm text-[var(--color-on-surface)]">
            <p>
              Nuevos: <strong>{state.inserted}</strong>
              {' · '}
              Actualizados: <strong>{state.updated}</strong>
              {state.errors.length > 0 && (
                <>
                  {' · '}
                  Errores: <strong>{state.errors.length}</strong>
                </>
              )}
            </p>
            {state.errors.length > 0 && (
              <ul className="mt-2 max-h-40 list-inside list-disc space-y-0.5 overflow-y-auto text-xs text-[var(--color-error)]">
                {state.errors.slice(0, 20).map((e) => (
                  <li key={`${e.row}-${e.message}`}>
                    Fila {e.row}: {e.message}
                  </li>
                ))}
                {state.errors.length > 20 && (
                  <li className="list-none text-[var(--color-on-surface-variant)]">
                    …y {state.errors.length - 20} más
                  </li>
                )}
              </ul>
            )}
          </div>
        )}

        {rows.length > 0 && !(state && submitted) && (
          <Button type="submit" disabled={isPending} fullWidth size="lg">
            {isPending ? 'Importando...' : `Importar ${rows.length} filas`}
          </Button>
        )}
      </form>
    </div>
  )
}
