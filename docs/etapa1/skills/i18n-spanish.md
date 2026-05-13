# Skill: i18n-spanish

## Cuándo usarla
Cualquier texto visible al usuario.

## Regla general
- **UI:** español (México).
- **Código, identificadores, tipos:** inglés.
- **Logs y comentarios técnicos:** inglés.
- **Mensajes de error mostrados al usuario:** español.
- **Mensajes de error en consola/logs:** inglés.

## Convenciones español MX
- Tono cercano pero profesional. Tutea ("Crea tu primer contacto" mejor que "Cree...").
- Frases cortas. Imperativos directos.
- Sin "Por favor" cargado. Una vez al inicio basta.
- Usar mayúscula inicial en títulos, no Title Case.
- Plurales correctos:
  - "1 contacto" / "2 contactos"
  - "Sin contactos aún"

## Términos canónicos
| Concepto | Texto UI |
|---|---|
| Contact | Contacto |
| Deal | Oportunidad |
| Stage | Etapa |
| Sale | Venta |
| Refund | Reembolso |
| Webinar | Webinar |
| Form | Formulario |
| Submission | Respuesta |
| Campaign | Campaña |
| Template | Plantilla |
| Segment | Segmento |
| Recipient | Destinatario |
| Tag | Etiqueta |
| Settings | Ajustes |
| Audit Log | Auditoría |
| Sign in | Iniciar sesión |
| Sign out | Cerrar sesión |
| Sign up | Registrarse |
| Required | Obligatorio |
| Optional | Opcional |

## Status labels
| Enum | Texto UI |
|---|---|
| NEW | Nuevo |
| QUALIFIED | Calificado |
| CLIENT | Cliente |
| LEAD | Lead |
| DEMO | Demo |
| NEGOTIATION | Negociación |
| ENROLLED | Inscrito |
| DRAFT | Borrador |
| SENDING | Enviando |
| SENT | Enviada |
| PARTIAL | Parcial |
| FAILED | Fallida |
| ARCHIVED | Archivada |
| PUBLISHED | Publicado |
| PENDING | Pendiente |
| PAID | Pagada |
| REFUNDED | Reembolsada |
| CANCELED | Cancelada |
| ATTENDED | Asistió |
| REGISTERED | Registrado |
| PURCHASED | Compró |

## Helpers
```ts
// lib/i18n/labels.ts
export const ContactStatusLabel: Record<ContactStatus, string> = {
  NEW: "Nuevo",
  QUALIFIED: "Calificado",
  CLIENT: "Cliente",
};
export const DealStageLabel: Record<DealStage, string> = {
  LEAD: "Lead",
  DEMO: "Demo",
  NEGOTIATION: "Negociación",
  ENROLLED: "Inscrito",
};
// ...etc
```

## Mensajes de error (UI)
- Genéricos: "Algo salió mal. Intenta de nuevo."
- VALIDATION_ERROR: muestra texto por campo (también en español).
- UNAUTHORIZED: "Inicia sesión para continuar."
- FORBIDDEN: "No tienes permiso para esta acción."
- NOT_FOUND: "No encontramos lo que buscas."
- CONFLICT: "Ya existe un registro con esos datos."
- RATE_LIMITED: "Demasiados intentos. Espera un momento."
- INTEGRATION_ERROR: "Servicio externo no disponible."

## Empty states
- Contactos: "Aún no tienes contactos. Crea el primero."
- Pipeline: "Sin oportunidades. Mueve un contacto al embudo."
- Webinars: "Sin webinars programados."
- Campañas: "Aún no envías campañas."

## Fechas
- Formato corto: `dd/mm/yyyy`.
- Relativo en feeds: `hace 3 horas`, `ayer`, `hace 2 días`.
- Lib: `date-fns/locale/es-MX` o utilidad propia.

## Anti-patrones
- Mezclar idiomas en la misma pantalla.
- Traducir nombres de variables/enums (deben quedar en inglés en código).
- Mayúsculas en mitad de oración tipo inglés.
