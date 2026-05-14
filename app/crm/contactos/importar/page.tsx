import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CsvImporter } from '../_components/CsvImporter'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export default function ImportarContactosPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/crm/contactos" className={TOK.linkBack}>
        <ArrowLeft size={16} strokeWidth={2} />
        Volver a contactos
      </Link>

      <div className={`${TOK.panel} ${TOK.panelPad}`}>
        <h1 className="mb-2 text-lg font-semibold tracking-tight text-[var(--color-on-surface)]">
          Importar contactos
        </h1>
        <p className={`mb-6 ${TOK.textMuted}`}>
          Sube un CSV con cabecera. Las filas válidas se crean o actualizan por email.
        </p>
        <CsvImporter standalone />
      </div>
    </div>
  )
}
