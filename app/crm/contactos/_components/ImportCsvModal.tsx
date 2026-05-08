'use client'

import { Upload } from 'lucide-react'
import { useState, useActionState, useRef } from 'react'
import { importContacts } from '../actions'
import { Button, ModalWrapper } from '@/app/crm/_components/ui'

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

export function ImportCsvModal() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [state, formAction, isPending] = useActionState(importContacts, null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setRows(parseCsv(text))
    }
    reader.readAsText(file)
  }

  function handleClose() {
    setOpen(false)
    setRows([])
    setSubmitted(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="secondary">
        <Upload size={16} strokeWidth={2} />
        Importar CSV
      </Button>

      {open && (
        <ModalWrapper onClose={handleClose} title="Importar contactos desde CSV">
            <p className="mb-4 text-sm leading-6 text-[#8a8a8a]">
              El CSV debe tener cabecera con columnas: <code className="rounded bg-gray-100 px-1">nombre</code>, <code className="rounded bg-gray-100 px-1">email</code> (requeridas), <code className="rounded bg-gray-100 px-1">telefono</code>, <code className="rounded bg-gray-100 px-1">fuente</code> (opcionales).
            </p>

            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mb-4 block w-full rounded-2xl border border-[#f2f2f2] bg-[#f7f8fa] p-3 text-sm text-[#8a8a8a] file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#dfff00] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#080808] hover:file:brightness-95"
            />

            {rows.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Vista previa: primeras 5 filas de {rows.length} detectadas:
                </p>
                <div className="overflow-x-auto rounded-2xl border border-[#e5e7eb]">
                  <table className="min-w-full text-xs">
                    <thead className="bg-[#f7f8fa]">
                      <tr>
                        {['Nombre', 'Email', 'Teléfono', 'Fuente'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">{row.email}</td>
                          <td className="px-3 py-2">{row.phone ?? '—'}</td>
                          <td className="px-3 py-2">{row.source ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {state && submitted && (
              <div className="mb-4 rounded-2xl bg-[#dfff00]/20 px-4 py-3 text-sm text-[#080808]">
                Importados: <strong>{state.imported}</strong> · Omitidos: <strong>{state.skipped}</strong>
                {state.errors.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    Errores en: {state.errors.slice(0, 5).join(', ')}
                    {state.errors.length > 5 && ` y ${state.errors.length - 5} más`}
                  </p>
                )}
              </div>
            )}

            <form
              action={(fd) => {
                fd.set('rows', JSON.stringify(rows))
                setSubmitted(true)
                formAction(fd)
              }}
            >
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="secondary"
                  fullWidth
                  size="lg"
                >
                  {state && submitted ? 'Cerrar' : 'Cancelar'}
                </Button>
                {rows.length > 0 && !(state && submitted) && (
                  <Button
                    type="submit"
                    disabled={isPending}
                    fullWidth
                    size="lg"
                  >
                    {isPending ? 'Importando...' : `Importar ${rows.length} contactos`}
                  </Button>
                )}
              </div>
            </form>
        </ModalWrapper>
      )}
    </>
  )
}
