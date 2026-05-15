'use client'

import { usePathname } from 'next/navigation'

type RouteMeta = {
  title: string
  description?: string
}

const ROUTE_META: Record<string, RouteMeta> = {
  '/crm/dashboard': {
    title: 'Dashboard',
    description: 'Resumen operativo del CRM.',
  },
  '/crm/contactos': {
    title: 'Contactos',
    description: 'Gestiona contactos, filtros, tags e historial del CRM.',
  },
  '/crm/pipeline': {
    title: 'Pipeline',
    description: 'Seguimiento de oportunidades de venta',
  },
  '/crm/webinars': {
    title: 'Webinars',
    description: 'Gestión de eventos y participantes',
  },
  '/crm/formularios': {
    title: 'Formularios',
    description: 'Crea formularios y captura leads al CRM.',
  },
  '/crm/landings/nuevo': {
    title: 'Nuevo funnel',
    description: 'Crea un funnel tipo webinar con paginas internas y tema global.',
  },
  '/crm/landings': {
    title: 'Landings',
    description: 'Construye funnels, paginas publicas, webinars y automatizaciones.',
  },
  '/crm/campanas/new': {
    title: 'Nueva campaña',
    description: 'Crea el mensaje, define la audiencia y guarda el borrador antes de enviarlo.',
  },
  '/crm/campanas': {
    title: 'Campañas',
    description: 'Email marketing segmentado por contactos registrados, leads, formularios, webinars y proyecto.',
  },
  '/crm/cursos': {
    title: 'Cursos',
    description: 'Gestión de cursos y programas',
  },
  '/crm/ventas': {
    title: 'Ventas',
    description: 'Registra ventas, cierra oportunidades y mide ingresos del CRM.',
  },
  '/crm/configuracion/usuarios': {
    title: 'Usuarios',
    description: 'Gestiona los usuarios del sistema y sus permisos.',
  },
  '/crm/configuracion/etiquetas': {
    title: 'Etiquetas',
    description: 'Administra el catálogo de etiquetas que se usa en contactos.',
  },
  '/crm/configuracion': {
    title: 'Configuración',
    description: 'Ajustes generales del CRM',
  },
}

const RESPONSES_META: RouteMeta = {
  title: 'Respuestas',
  description: 'Revisa las respuestas recibidas por este formulario.',
}

function getMeta(pathname: string): RouteMeta {
  if (pathname.startsWith('/crm/formularios/') && pathname.endsWith('/respuestas')) {
    return RESPONSES_META
  }

  if (pathname === '/crm/contactos/nuevo') {
    return {
      title: 'Nuevo contacto',
      description: 'Registra un contacto manualmente con email, fuente y etiquetas.',
    }
  }
  if (pathname === '/crm/contactos/importar') {
    return {
      title: 'Importar contactos',
      description: 'Sube un CSV con cabecera; el servidor valida e importa por email.',
    }
  }
  if (/^\/crm\/contactos\/\d+\/editar$/.test(pathname)) {
    return {
      title: 'Editar contacto',
      description: 'Actualiza datos, estado y etiquetas del contacto.',
    }
  }

  if (ROUTE_META[pathname]) return ROUTE_META[pathname]
  const match = Object.keys(ROUTE_META)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key + '/'))
  return match ? ROUTE_META[match] : { title: 'CRM' }
}

export function NavbarTitle() {
  const pathname = usePathname()
  const meta = getMeta(pathname)

  return (
    <div className="min-w-0">
      <span className="block text-[18px] font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">
        {meta.title}
      </span>
      {meta.description && (
        <p className="mt-1 max-w-[760px] truncate text-sm text-[var(--color-on-surface-variant)]">
          {meta.description}
        </p>
      )}
    </div>
  )
}
