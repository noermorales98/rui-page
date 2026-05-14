'use client'

import { useRef, useState } from 'react'
import { importRegistrations } from '../../actions'
import { useToast } from '@/app/crm/_components/ui'

function parseCsvLine(line: string): string[] {
  const cols: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      cols.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  cols.push(current.trim())
  return cols
}

interface Props {
  webinarId: number
}

export function ImportCsvButton({ webinarId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const { error: toastError } = useToast()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const lines = text.replace(/^﻿/, '').trim().split(/\r?\n/)
    if (lines.length < 2) {
      toastError('El CSV está vacío o no tiene datos.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
    const nameIdx = headers.findIndex((h) => h === 'nombre' || h === 'name')
    const emailIdx = headers.findIndex((h) => h === 'email' || h === 'correo')

    if (emailIdx === -1) {
      toastError('El CSV debe tener una columna llamada "email" o "correo".')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const rows = lines
      .slice(1)
      .filter((line) => line.trim())
      .map((line) => {
        const cols = parseCsvLine(line)
        return {
          name: nameIdx !== -1 ? (cols[nameIdx] ?? '') : (cols[emailIdx] ?? ''),
          email: cols[emailIdx] ?? '',
        }
      })
      .filter((r) => r.email.trim())

    if (rows.length === 0) {
      toastError('No se encontraron filas válidas en el CSV.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setLoading(true)
    setResult(null)
    const res = await importRegistrations(webinarId, rows)
    setLoading(false)
    if ('error' in res && res.error) {
      toastError(res.error)
    } else {
      setResult({ imported: res.imported, skipped: res.skipped })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="hidden"
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
      >
        {loading ? (
          'Importando...'
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            Importar CSV
          </>
        )}
      </button>
      {result && (
        <span className="text-xs text-gray-500">
          {result.imported} importado{result.imported !== 1 ? 's' : ''}
          {result.skipped > 0 ? `, ${result.skipped} omitido${result.skipped !== 1 ? 's' : ''}` : ''}
        </span>
      )}
    </div>
  )
}
