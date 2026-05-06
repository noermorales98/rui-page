'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { importContacts } from '../actions'

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
      phone: phoneIdx >= 0 ? cols[phoneIdx]?.trim() : undefined,
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
  return result
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
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.19l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3.75A.75.75 0 0 1 10 3Z" clipRule="evenodd" />
        </svg>
        Importar CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />
          <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Importar contactos desde CSV</h2>
              <button onClick={handleClose} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-500">
              El CSV debe tener cabecera con columnas: <code className="rounded bg-gray-100 px-1">nombre</code>, <code className="rounded bg-gray-100 px-1">email</code> (requeridas), <code className="rounded bg-gray-100 px-1">telefono</code>, <code className="rounded bg-gray-100 px-1">fuente</code> (opcionales).
            </p>

            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mb-4 block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
            />

            {rows.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Vista previa — primeras 5 filas de {rows.length} detectadas:
                </p>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50">
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
              <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
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
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {state && submitted ? 'Cerrar' : 'Cancelar'}
                </button>
                {rows.length > 0 && !(state && submitted) && (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isPending ? 'Importando...' : `Importar ${rows.length} contactos`}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
