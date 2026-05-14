import Link from 'next/link'

export default function ConfiguracionPage() {
  const sections = [
    { href: '/crm/configuracion/usuarios', label: 'Usuarios', description: 'Gestiona usuarios y roles del CRM.' },
    { href: '/crm/configuracion/etiquetas', label: 'Etiquetas', description: 'Crea y administra etiquetas de contactos.' },
    { href: '/crm/configuracion/integraciones', label: 'Integraciones', description: 'Conecta Zoom, Stripe, SMTP y más.' },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Configuración</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 hover:ring-indigo-300 transition"
          >
            <p className="font-semibold text-gray-900">{s.label}</p>
            <p className="mt-1 text-sm text-gray-500">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
