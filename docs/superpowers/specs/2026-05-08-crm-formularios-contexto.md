# CRM Formularios - Contexto Tecnico
Date: 2026-05-08

## Objetivo

Preparar la implementacion de `/crm/formularios`: una seccion del CRM donde un usuario autenticado pueda crear formularios, configurar sus propios campos y publicar formularios que capturen leads hacia la base de datos.

La peticion especifica estos inputs disponibles por defecto:

- Nombre
- Nombre completo
- Telefono
- Telefono con lada
- Correo
- Fecha
- Hora
- Fecha y hora

Los campos de fecha y hora no deben usar controles nativos de HTML como `type="date"`, `type="time"` o `type="datetime-local"`. Deben renderizarse con componentes propios y enviar un valor normalizado mediante campos ocultos o datos controlados.

## Estado Actual Del Proyecto

El proyecto vive en `/Users/noeli/Documents/Develop/rui` y usa:

- Next.js `16.2.3` con App Router en `app/`
- React `19.2.4`
- TypeScript estricto
- Tailwind CSS v4
- NextAuth v5 beta con Credentials Provider
- Prisma `7.8.0` con MySQL/MariaDB mediante `@prisma/adapter-mariadb`
- Zod para validacion de acciones server-side
- Lucide React para iconos del CRM

Las instrucciones locales de `AGENTS.md` obligan a leer documentacion local de Next en `node_modules/next/dist/docs/` antes de escribir codigo. Para este analisis se revisaron las guias locales de App Router, estructura de proyecto, Server/Client Components, Server Functions, mutacion de datos y forms.

## Estructura Relevante

Rutas publicas principales:

- `app/page.tsx`
- `app/funnel/page.tsx`
- `app/landing_page/page.tsx`
- `app/sales_page/page.tsx`
- `app/webinar/page.tsx`
- `app/webinar/WebinarForm.tsx`

CRM autenticado:

- `app/crm/layout.tsx`: layout server-side, valida sesion con `auth()` y renderiza sidebar
- `app/crm/_components/Sidebar.tsx`: navegacion del CRM, ya incluye `/crm/formularios`
- `app/crm/formularios/page.tsx`: placeholder actual
- `app/crm/contactos/*`: modulo completo de contactos
- `app/crm/pipeline/*`: modulo de pipeline con drag and drop
- `app/crm/webinars/*`: modulo de webinars y participantes
- `app/crm/configuracion/usuarios/*`: administracion de usuarios

Capa de datos y auth:

- `auth.ts`: NextAuth, sesiones JWT de 8 horas, roles `ADMIN` y `EDITOR`
- `proxy.ts`: protege `/crm/:path*` y redirige `/crm-login`
- `lib/prisma.ts`: singleton de Prisma con adapter MariaDB
- `prisma/schema.prisma`: modelos actuales de User, Contact, Tag, Activity, Deal, Webinar
- `prisma.config.ts`: Prisma 7, datasource configurado desde `DATABASE_URL`

## Patrones Del CRM Que Debe Seguir Formularios

1. Las paginas de CRM son Server Components por defecto.
2. Las mutaciones viven en `actions.ts` con `'use server'`.
3. Cada Server Action valida sesion con `auth()` aunque la pagina ya este protegida.
4. Los formularios interactivos usan Client Components y `useActionState`.
5. Los errores de validacion regresan como `{ error: string } | null`.
6. Despues de mutar datos se usa `revalidatePath()`.
7. `params` y `searchParams` son `Promise<...>` en Next 16 y se deben `await`.
8. Las busquedas ligeras para autocomplete usan Route Handlers, por ejemplo `app/api/crm/contacts-search/route.ts`.
9. La UI actual usa tarjetas blancas, `rounded-xl`, `shadow-sm`, `ring-1 ring-gray-200`, acento indigo y layout administrativo denso.

## Estado Actual De La Base De Datos

Modelos existentes:

- `User`: usuarios del CRM, roles y estado activo
- `Contact`: leads/contactos con `email` unico, fuente y estado
- `Tag` y `ContactTag`: etiquetado de contactos
- `ContactActivity`: notas y eventos ligados a contacto
- `Deal`: oportunidades por contacto en pipeline
- `Webinar` y `WebinarRegistration`: eventos y participantes

Enums existentes relevantes:

- `ContactSource`: `WEBINAR`, `FORM`, `MANUAL`, `IMPORT`
- `ContactStatus`: `NEW`, `QUALIFIED`, `CLIENT`
- `ActivityType`: `NOTE`, `EMAIL_SENT`, `WEBINAR_REGISTERED`, `WEBINAR_ATTENDED`, `COURSE_PURCHASED`

Para formularios conviene agregar `FORM_SUBMITTED` a `ActivityType`, porque una respuesta de formulario debe aparecer como actividad historica del contacto.

## Cambios Sin Commit Detectados

Hay cambios locales no comprometidos en:

- `app/api/crm/contacts-search/route.ts`
- `app/crm/pipeline/_components/CreateDealModal.tsx`
- `lib/prisma.ts`
- `.superpowers/` aparece como no trackeado, sin archivos listados

No se deben revertir. En particular, `lib/prisma.ts` ya tiene una mejora local con `connectionLimit: 1`, util para un hosting MySQL compartido.

## Diseño De Datos Recomendado

La base no debe crear columnas dinamicas por cada campo del formulario. Eso vuelve dificil migrar, indexar y consultar. La opcion mas estable es un modelo normalizado:

- `CrmForm`: definicion del formulario
- `CrmFormField`: campos configurables por formulario
- `CrmFormSubmission`: una respuesta enviada
- `CrmFormSubmissionValue`: valores por campo

Ventajas:

- Permite campos personalizados sin alterar columnas.
- Mantiene indices por formulario, campo, fecha y contacto.
- Evita JSON gigante como unico almacenamiento consultable.
- Permite capturar cualquier formulario sin perder estructura.
- Permite mapear ciertos campos a `Contact` sin duplicar toda la entidad.

Esquema propuesto:

```prisma
enum CrmFormStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum CrmFormFieldType {
  SHORT_TEXT
  FULL_NAME
  PHONE
  PHONE_WITH_COUNTRY
  EMAIL
  CUSTOM_DATE
  CUSTOM_TIME
  CUSTOM_DATETIME
}

enum CrmFormContactTarget {
  NONE
  NAME
  EMAIL
  PHONE
}

model CrmForm {
  id             Int                 @id @default(autoincrement())
  name           String
  slug           String              @unique @db.VarChar(191)
  status         CrmFormStatus       @default(DRAFT)
  description    String?             @db.Text
  submitLabel    String              @default("Enviar")
  successMessage String              @default("Gracias, recibimos tus datos.")
  createdById    Int?
  createdBy      User?               @relation(fields: [createdById], references: [id], onDelete: SetNull)
  fields         CrmFormField[]
  submissions    CrmFormSubmission[]
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  @@index([createdById])
  @@index([status, updatedAt])
}

model CrmFormField {
  id            Int                  @id @default(autoincrement())
  formId        Int
  form          CrmForm              @relation(fields: [formId], references: [id], onDelete: Cascade)
  type          CrmFormFieldType
  contactTarget CrmFormContactTarget @default(NONE)
  label         String
  fieldKey      String               @db.VarChar(191)
  placeholder   String?
  helpText      String?              @db.Text
  isRequired    Boolean              @default(false)
  position      Int                  @default(0)
  config        Json?
  values        CrmFormSubmissionValue[]
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  @@unique([formId, fieldKey])
  @@index([formId, position])
}

model CrmFormSubmission {
  id          Int                      @id @default(autoincrement())
  formId      Int
  form        CrmForm                  @relation(fields: [formId], references: [id], onDelete: Cascade)
  contactId   Int?
  contact     Contact?                 @relation(fields: [contactId], references: [id], onDelete: SetNull)
  submittedAt DateTime                 @default(now())
  ipHash      String?
  userAgent   String?                  @db.Text
  values      CrmFormSubmissionValue[]

  @@index([formId, submittedAt])
  @@index([contactId])
}

model CrmFormSubmissionValue {
  id              Int               @id @default(autoincrement())
  submissionId    Int
  submission      CrmFormSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  fieldId         Int
  field           CrmFormField      @relation(fields: [fieldId], references: [id], onDelete: Cascade)
  rawValue        String?           @db.Text
  normalizedValue String?           @db.VarChar(191)

  @@unique([submissionId, fieldId])
  @@index([fieldId, normalizedValue])
}
```

Relaciones a agregar:

```prisma
model User {
  forms CrmForm[]
}

model Contact {
  formSubmissions CrmFormSubmission[]
}
```

## Optimizacion De Base De Datos

Decisiones recomendadas:

- Mantener `CrmForm.slug` unico y de longitud indexable (`@db.VarChar(191)`).
- Indexar `CrmForm.status + updatedAt` para listar formularios activos rapidamente.
- Indexar `CrmFormField.formId + position` para renderizar campos en orden sin ordenar en memoria.
- Usar `@@unique([formId, fieldKey])` para nombres internos estables por formulario.
- Indexar `CrmFormSubmission.formId + submittedAt` para listar respuestas recientes por formulario.
- Indexar `CrmFormSubmission.contactId` para historial desde contacto.
- Guardar valores largos en `rawValue @db.Text`, pero guardar valores buscables en `normalizedValue @db.VarChar(191)`.
- Indexar `CrmFormSubmissionValue.fieldId + normalizedValue` para futuras busquedas por email, telefono o fecha normalizada.
- Usar transacciones para crear `Contact`, `CrmFormSubmission`, `CrmFormSubmissionValue` y `ContactActivity` en una sola operacion consistente.
- En listados, usar `select` y `_count` en vez de `include` completo cuando solo se necesitan contadores.
- Paginar respuestas desde el inicio. El patron actual de contactos usa `PAGE_SIZE = 50`; formularios puede usar 50 tambien.

## Rutas Recomendadas

CRM privado:

- `/crm/formularios`: listado de formularios, estado, total de respuestas y ultima respuesta
- `/crm/formularios/[id]`: constructor del formulario
- `/crm/formularios/[id]/respuestas`: tabla paginada de respuestas

Publico:

- `/formularios/[slug]`: formulario publicado y enviable sin login

La ruta publica no debe depender del layout de CRM. Debe validar que el formulario exista y este `PUBLISHED`.

## UX Recomendada Para `/crm/formularios`

Listado:

- Header "Formularios"
- Boton "Nuevo formulario"
- Tabla: nombre, estado, slug/public URL, campos, respuestas, actualizado, acciones
- Acciones: abrir constructor, copiar URL, publicar/despublicar, archivar

Constructor:

- Columna izquierda: paleta de inputs disponibles por defecto
- Columna central: preview ordenado del formulario
- Columna derecha: editor del campo seleccionado
- Configuracion del formulario: nombre, slug, descripcion, texto del boton, mensaje de exito, estado
- Botones por campo: mover arriba, mover abajo, eliminar
- Indicadores claros para `isRequired` y mapeo a contacto

Inputs temporales custom:

- `CUSTOM_DATE`: selector propio con mes/anio, grid de dias y campo oculto `YYYY-MM-DD`
- `CUSTOM_TIME`: selector propio de hora/minuto con botones o selectores visuales y campo oculto `HH:mm`
- `CUSTOM_DATETIME`: composicion del selector de fecha y selector de hora, campo oculto `YYYY-MM-DDTHH:mm`
- Ninguno debe usar `input type="date"`, `input type="time"` o `input type="datetime-local"`.

## Integracion Con Contactos

Al enviar un formulario publico:

1. El server action carga el formulario publicado con campos.
2. Valida campos requeridos y formatos por tipo.
3. Extrae primer campo mapeado a `EMAIL`.
4. Si hay email valido, busca o crea `Contact` con `source: FORM`.
5. Si el contacto ya existe, solo rellena datos faltantes, no pisa datos editados manualmente.
6. Crea `CrmFormSubmission`.
7. Crea `CrmFormSubmissionValue[]`.
8. Crea `ContactActivity` con `type: FORM_SUBMITTED` cuando exista contacto.
9. Revalida las rutas internas del CRM afectadas.

## Riesgos Y Cuidados

- Server Actions son invocables via POST directo. Las acciones privadas deben validar sesion dentro de cada funcion.
- La ruta publica no debe crear contactos si el formulario esta en `DRAFT` o `ARCHIVED`.
- Los valores de email y telefono deben normalizarse en servidor.
- El modulo no debe usar tipos HTML nativos para fecha/hora, incluso si son mas rapidos de implementar.
- No hay framework de tests configurado. La verificacion debe incluir `npm run build`, `npm run lint` y prueba manual en navegador.
- Prisma usa una base MySQL remota. Evitar consultas N+1 y usar transacciones con pocas operaciones.

## Decision Recomendada

Construir el modulo en dos capas:

1. Primero, CRM privado con modelo de formularios, builder, acciones autenticadas y preview.
2. Despues, renderer publico con submission transaccional e integracion con contactos.

Esta secuencia reduce riesgo: primero se valida la estructura y el guardado de definiciones, luego se abre la captura publica.
