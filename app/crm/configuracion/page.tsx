import Link from 'next/link'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export default function ConfiguracionPage() {
  const sections = [
    { href: '/crm/configuracion/usuarios', label: 'Usuarios', description: 'Gestiona usuarios y roles del CRM.' },
    { href: '/crm/configuracion/etiquetas', label: 'Etiquetas', description: 'Crea y administra etiquetas de contactos.' },
    { href: '/crm/configuracion/integraciones', label: 'Integraciones', description: 'Conecta Zoom, Stripe, SMTP y más.' },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-on-surface)]">Configuración</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`${TOK.panel} block p-5 transition hover:bg-[var(--color-surface-container-low)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]`}
          >
            <p className="font-semibold text-[var(--color-on-surface)]">{s.label}</p>
            <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
