import { parse } from 'csv-parse/sync'

/** Límite MVP (skills/csv-import). */
export const MAX_CSV_BYTES = 5 * 1024 * 1024

function detectDelimiter(headerLine: string): ',' | ';' | '\t' {
  const comma = (headerLine.match(/,/g) ?? []).length
  const semi = (headerLine.match(/;/g) ?? []).length
  if (semi > comma) return ';'
  if (headerLine.includes('\t') && headerLine.split('\t').length > 1) return '\t'
  return ','
}

/**
 * Parsea CSV en memoria (UTF-8; si hay reemplazos inválidos, reintenta Latin-1).
 * Cabecera obligatoria en la primera fila no vacía.
 */
export function parseCsvBufferToRecords(buffer: Buffer): Record<string, string>[] {
  if (buffer.length > MAX_CSV_BYTES) {
    throw new Error('CSV demasiado grande (máx. 5 MB)')
  }

  let text = buffer.toString('utf8')
  if (/\uFFFD/.test(text)) {
    text = buffer.toString('latin1')
  }

  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? ''
  const delimiter = detectDelimiter(firstLine)

  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    delimiter,
    relax_column_count: true,
    relax_quotes: true,
  }) as Record<string, string>[]

  return records.map((row) => {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(row)) {
      const key = String(k).trim()
      if (!key) continue
      out[key] = v == null ? '' : String(v).trim()
    }
    return out
  })
}
