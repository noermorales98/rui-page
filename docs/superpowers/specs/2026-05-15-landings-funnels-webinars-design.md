# Landings, Funnels y Webinars Design
Date: 2026-05-15

## Objetivo

Crear una nueva seccion **Landings** dentro del CRM para construir funnels visuales y paginas publicas sin conocimientos tecnicos. La primera version debe permitir crear funnels tipo webinar con paginas internas, editar contenido desde un Studio por pestanas, usar tema global, pegar HTML cuando haga falta, publicar URLs publicas y conectar automatizaciones iniciales.

El caso base replica y vuelve dinamicas estas paginas actuales:

- `/webinar` - registro al webinar
- `/webinar/gracias` - confirmacion despues del formulario
- `/webinar/acceso` - bienvenida antes de entrar al evento
- `/webinar/sala` - sala con iframe/link del vivo

## Decisiones Aprobadas

- El objeto principal sera un **Funnel** con paginas internas.
- La primera entrega sera completa y usable, no un canvas libre avanzado.
- Las URLs publicas usaran `/f/[slug]`, `/f/[slug]/gracias`, `/f/[slug]/acceso` y `/f/[slug]/sala`.
- El editor sera un **Studio por pestanas**, no un builder de tres columnas.
- El tema sera global por funnel.
- Cada pagina podra ser `VISUAL` o `HTML`.
- El modo visual tambien tendra un bloque `CUSTOM_HTML`.
- Los webinars estaran conectados a funnels.
- El MVP incluye flujo de paginas y automatizaciones.
- WhatsApp queda como accion futura deshabilitada.

## Estado Actual Del Proyecto

El repo ya tiene piezas importantes:

- Next.js `16.2.3` con App Router y `params`/`searchParams` como `Promise`.
- CRM autenticado en `/crm`.
- CRUD de webinars en `/crm/webinars`.
- Modelos Prisma existentes para `Webinar`, `WebinarRegistration`, `Landing`, `LandingBlock`, `LandingView`, `Flow`, `FlowStep`, `FlowRun` y `FlowRunStep`.
- Formularios publicos en `/formularios/[slug]`.
- Paginas estaticas de webinar en `app/webinar/*`.
- Sidebar y titulos de navbar centralizados en `app/crm/_components/SidebarNav.tsx` y `NavbarTitle.tsx`.

Aunque existe un modelo `Landing`, el producto aprobado necesita agrupar paginas internas por funnel. Para evitar forzar una entidad multipagina dentro de `Landing`, esta especificacion agrega modelos `Funnel` y `FunnelPage`. Los modelos `Landing` existentes pueden permanecer para compatibilidad o para landings sueltas futuras.

## Modelo De Producto

### Funnel

Un `Funnel` representa una experiencia publica completa. Puede ser:

- `WEBINAR`: crea o conecta un webinar CRM y paginas internas de registro, gracias, acceso y sala.
- `GENERAL`: sirve para funnels o landings no asociadas a webinar.

Campos funcionales:

- nombre visible
- slug publico
- estado de publicacion
- tipo
- tema global
- categorias
- webinar conectado opcional
- usuario creador

### Paginas Internas

Un funnel tipo webinar crea estas paginas iniciales:

- `REGISTRATION`: pagina principal de registro, URL `/f/[slug]`.
- `THANK_YOU`: pagina de gracias, URL `/f/[slug]/gracias`.
- `ACCESS`: pagina de bienvenida, URL `/f/[slug]/acceso`.
- `ROOM`: sala en vivo, URL `/f/[slug]/sala`.

Se podran crear paginas `CUSTOM` despues, con slug interno propio: `/f/[slug]/[pageSlug]`.

### Tema Global

El tema vive en `Funnel.theme` como JSON validado. Incluye:

```json
{
  "font": "serif",
  "backgroundColor": "#f4ede4",
  "surfaceColor": "#faf6f1",
  "textColor": "#2a231c",
  "mutedTextColor": "#5c4f42",
  "accentColor": "#9a7b45",
  "buttonStyle": "solid",
  "radius": "sm"
}
```

Las paginas heredan el tema. La primera version no tendra overrides visuales por pagina; eso evita inconsistencias y simplifica el Studio.

## Rutas Publicas

El router publico debe resolver una pagina por `funnel.slug` y una clave interna estable de pagina. Las paginas custom tambien usan `page.slug`.

```text
/f/[slug]          -> REGISTRATION
/f/[slug]/gracias  -> THANK_YOU
/f/[slug]/acceso   -> ACCESS
/f/[slug]/sala     -> ROOM
/f/[slug]/[page]   -> CUSTOM por slug interno
```

Reglas:

- Solo funnels `PUBLISHED` se renderizan publicamente.
- Una pagina inexistente llama `notFound()`.
- Una pagina en modo `HTML` renderiza `customHtml` y `customCss` sanitizados.
- Una pagina en modo `VISUAL` renderiza `blocks` con el motor compartido.
- La pagina `ROOM` puede mostrar un `iframe` o link del webinar.

## Studio En CRM

Ruta base:

```text
/crm/landings
/crm/landings/nuevo
/crm/landings/[id]
```

La seccion se llama **Landings** en el menu, pero el listado muestra funnels.

### Pestanas Del Studio

`/crm/landings/[id]?tab=paginas`

- Lista paginas internas.
- Permite seleccionar pagina activa.
- Permite agregar pagina custom.
- Muestra URL publica de cada pagina si el funnel esta publicado.

`/crm/landings/[id]?tab=contenido&page=[pageId]`

- Editor visual para la pagina seleccionada.
- Permite agregar, reordenar, duplicar y eliminar bloques.
- Edita campos simples por bloque.

`/crm/landings/[id]?tab=tema`

- Edita tema global del funnel.
- Muestra preview compacto con el estilo aplicado.

`/crm/landings/[id]?tab=html&page=[pageId]`

- Permite cambiar modo de pagina entre `VISUAL` y `HTML`.
- Si es `HTML`, edita HTML y CSS completos.
- Si es `VISUAL`, muestra ayuda para usar bloque `CUSTOM_HTML`.

`/crm/landings/[id]?tab=flujo`

- Configura flujo de paginas.
- Configura automatizaciones del funnel.

`/crm/landings/[id]?tab=publicacion`

- Edita slug, estado, SEO basico y webinar conectado.
- Publica, archiva o vuelve a borrador.

## Bloques Visuales

La primera version incluye:

- `HERO`: titulo, subtitulo, eyebrow, texto de boton, destino de boton.
- `TEXT`: titulo, cuerpo.
- `VIDEO`: URL o iframe permitido.
- `FORM`: formulario de registro del funnel.
- `CTA`: titulo, texto, boton.
- `FAQ`: lista de preguntas/respuestas.
- `TESTIMONIALS`: lista simple.
- `WEBINAR_ROOM`: iframe/link del vivo y texto de soporte.
- `CUSTOM_HTML`: HTML y CSS de bloque, sanitizados.
- `FOOTER`: texto y links.

Los bloques se guardan como JSON en `FunnelPage.blocks`. Esto acelera el MVP y mantiene el render simple. La normalizacion por bloque queda fuera de la primera version.

## Modo HTML

Cada pagina tiene `mode`:

- `VISUAL`: usa `blocks`.
- `HTML`: ignora `blocks` y renderiza `customHtml`/`customCss`.

Reglas:

- Se sanitiza antes de guardar y antes de renderizar.
- No se permiten `<script>`, handlers inline como `onclick`, ni CSS peligroso como `expression()`.
- `iframe` solo permite proveedores aprobados para video/webinar.
- HTML completo se renderiza dentro del shell publico del funnel para aplicar metadata y controles basicos de seguridad.

## Datos Prisma Propuestos

```prisma
enum FunnelType {
  WEBINAR
  GENERAL
}

enum FunnelStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum FunnelPageKind {
  REGISTRATION
  THANK_YOU
  ACCESS
  ROOM
  CUSTOM
}

enum FunnelPageMode {
  VISUAL
  HTML
}

model Funnel {
  id          Int              @id @default(autoincrement())
  name        String
  slug        String           @unique @db.VarChar(191)
  type        FunnelType       @default(GENERAL)
  status      FunnelStatus     @default(DRAFT)
  theme       Json
  webinarId   Int?
  webinar     Webinar?         @relation(fields: [webinarId], references: [id], onDelete: SetNull)
  pages       FunnelPage[]
  categories  FunnelCategoryOnFunnel[]
  createdById Int?
  createdBy   User?            @relation(fields: [createdById], references: [id], onDelete: SetNull)
  deletedAt   DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([status, updatedAt])
  @@index([type, status])
  @@index([webinarId])
  @@index([createdById])
  @@index([deletedAt])
}

model FunnelPage {
  id          Int            @id @default(autoincrement())
  funnelId    Int
  funnel      Funnel         @relation(fields: [funnelId], references: [id], onDelete: Cascade)
  kind        FunnelPageKind
  key         String         @db.VarChar(64)
  slug        String?        @db.VarChar(191)
  mode        FunnelPageMode @default(VISUAL)
  title       String?
  description String?        @db.Text
  blocks      Json
  customHtml  String?        @db.Text
  customCss   String?        @db.Text
  position    Int            @default(0)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@unique([funnelId, key])
  @@unique([funnelId, slug])
  @@index([funnelId, position])
}

model FunnelCategory {
  id        Int                      @id @default(autoincrement())
  name      String                   @unique
  color     String                   @default("#9a7b45")
  funnels   FunnelCategoryOnFunnel[]
  createdAt DateTime                 @default(now())
  updatedAt DateTime                 @updatedAt
}

model FunnelCategoryOnFunnel {
  funnelId   Int
  categoryId Int
  funnel     Funnel         @relation(fields: [funnelId], references: [id], onDelete: Cascade)
  category   FunnelCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([funnelId, categoryId])
}
```

Relaciones adicionales:

```prisma
model User {
  funnels Funnel[]
}

model Webinar {
  funnels Funnel[]
}
```

## Crear Funnel Tipo Webinar

El flujo de creacion en `/crm/landings/nuevo`:

1. Usuario elige tipo `WEBINAR`.
2. Escribe nombre, slug, fecha, tema del webinar, link/iframe opcional y categorias.
3. El sistema crea `Webinar`.
4. El sistema crea `Funnel` conectado al `Webinar`.
5. El sistema crea cuatro `FunnelPage` iniciales con bloques semilla:
   - Registro: `key = "registration"`, hero + form + texto + CTA + footer.
   - Gracias: `key = "thank_you"`, mensaje + CTA.
   - Acceso: `key = "access"`, bienvenida + reglas + boton a sala.
   - Sala: `key = "room"`, video/webinar room + apoyo + footer.
6. Redirige al Studio del funnel.

## Submit De Registro

Endpoint publico:

```text
POST /api/funnels/[slug]/register
```

Entrada minima:

```json
{
  "name": "Nombre",
  "email": "correo@dominio.com",
  "phone": "+52..."
}
```

Proceso:

1. Rate limit por IP.
2. Buscar funnel `PUBLISHED` por slug con pagina `REGISTRATION`.
3. Validar payload con Zod.
4. Crear o actualizar `Contact` por email.
5. Si el funnel tiene webinar, crear `WebinarRegistration` con `REGISTERED`.
6. Crear `ContactActivity` de `WEBINAR_REGISTERED` y `FORM_SUBMITTED` cuando aplique.
7. Disparar `dispatch("WEBINAR_REGISTERED")` y `dispatch("LANDING_SUBMITTED")`.
8. Resolver redirect:
   - Si un flow activo devuelve `redirectUrl`, usarlo.
   - Si no, redirigir a `/f/[slug]/gracias`.
9. Responder `{ ok: true, redirectUrl }`.

El formulario publico hara redirect client-side con el `redirectUrl` recibido.

## Flujo De Paginas

La pestaña **Flujo** define links internos por defecto:

- Registro enviado -> Gracias.
- CTA de Gracias -> URL configurable o vacio.
- CTA de Acceso -> Sala.
- Sala -> muestra vivo o link externo.

La primera version guarda esta configuracion dentro de `FunnelPage.blocks` en los botones de CTA y en la configuracion del bloque `FORM`. Las automatizaciones viven en `Flow`.

## Automatizaciones

Se usara el modelo `Flow` existente.

Triggers iniciales:

- `LANDING_SUBMITTED`
- `WEBINAR_REGISTERED`

Acciones iniciales:

- `WAIT`
- `ASSIGN_TAG`
- `UPDATE_CONTACT_STATUS`
- `CREATE_DEAL`
- `MOVE_DEAL`
- `SEND_EMAIL`
- `REDIRECT`

WhatsApp:

- Aparece como accion futura deshabilitada en UI.
- No se ejecuta en el motor de la primera version.

Builder:

- Lista vertical de pasos.
- Cada paso tiene accion, configuracion y retraso.
- `REDIRECT` solo puede estar en primera posicion.
- Se muestra resumen textual: "Cuando alguien se registra -> esperar 10 min -> asignar etiqueta -> enviar email".

Engine:

- Implementar `lib/flows/engine.ts`, `triggers.ts` y actions necesarias.
- `dispatch()` se invoca desde el registro del funnel.
- `processPendingSteps()` se invoca desde cron protegido por `CRON_SECRET`.

## Seguridad

- CRM: todas las acciones privadas usan `requireRole`.
- Roles:
  - `ADMIN` y `VENDEDOR`: crear, editar, publicar, archivar funnels.
  - `ASISTENTE`: solo lectura en la primera version de Landings.
- Publico: submit con rate limit y validacion.
- HTML y CSS se sanitizan al guardar y al renderizar.
- No se guardan tokens ni iframes arbitrarios.
- AuditLog para crear, actualizar, publicar, archivar y eliminar funnels.

## UI Del CRM

Sidebar:

- Agregar item `Landings` con ruta `/crm/landings`.

Listado:

- Tabla/cards con nombre, tipo, estado, categorias, webinar, actualizado, URL publica.
- Acciones: abrir Studio, copiar URL, publicar/archivar.

Studio:

- Mantener estilo administrativo actual del CRM.
- Usar componentes existentes de `app/crm/_components/ui`.
- Evitar hero marketing dentro del CRM.
- Layout denso y escaneable, con preview embebida cuando aporte claridad.

## Public UI

El render publico debe sentirse cercano a las paginas actuales de `/webinar`:

- tono editorial y sobrio
- fuerte jerarquia tipografica
- CTA claro
- formularios simples
- paginas `acceso` y `sala` con atmosfera mas inmersiva

El tema global permite replicar esa identidad sin hardcodear cada pagina.

## Testing

Unit tests:

- slug de funnel y categorias.
- resolver pagina publica por slug y path.
- defaults de paginas webinar.
- sanitizacion de HTML/CSS.
- validacion de bloques.
- matching de flows por triggerConfig.
- REDIRECT solo en primera posicion.

Integration tests:

- crear funnel webinar crea webinar + cuatro paginas.
- submit registro crea/actualiza contacto.
- submit registro crea `WebinarRegistration`.
- submit registro devuelve `/f/[slug]/gracias` cuando no hay redirect de flow.
- flow con redirect devuelve URL configurada.
- cron procesa step pendiente.

Browser checks:

- abrir `/crm/landings`.
- crear funnel tipo webinar.
- editar tema global.
- editar pagina en modo visual.
- cambiar una pagina a HTML.
- publicar.
- abrir `/f/[slug]`, `/gracias`, `/acceso`, `/sala`.

## Fuera De Alcance De La Primera Version

- Canvas libre tipo Figma.
- A/B testing.
- Metricas avanzadas por bloque.
- Colaboracion en tiempo real.
- Versionado historico de paginas.
- WhatsApp activo.
- Plantillas marketplace.
- Dominio custom por funnel.

## Riesgos Y Mitigaciones

- **Alcance amplio**: dividir implementacion en tareas pequeñas y verificables: schema, servicios, UI listado, Studio, render publico, submit, flows.
- **HTML inseguro**: sanitizar dos veces y limitar iframes.
- **Automatizaciones incompletas**: empezar con lista vertical y engine minimo, no canvas.
- **Duplicacion con Landing existente**: mantener `Landing` sin tocar y construir `Funnel` como nueva capa.
- **Publicacion rota por datos incompletos**: `publishFunnel` validara slug, paginas requeridas y sala si hay webinar.

## Criterios De Aceptacion

- Un usuario puede crear un funnel tipo webinar desde `/crm/landings`.
- El sistema crea las cuatro paginas internas.
- El usuario puede editar tema global.
- El usuario puede editar una pagina visualmente.
- El usuario puede usar HTML completo en una pagina.
- El usuario puede publicar y abrir las cuatro URLs publicas.
- El formulario de registro crea contacto y registro al webinar.
- La pagina de gracias se alcanza despues del registro.
- La pagina de acceso enlaza a sala.
- La sala muestra link o iframe del webinar.
- El usuario puede crear categorias y asignarlas al funnel.
- El usuario puede configurar una automatizacion inicial sin WhatsApp.
- Los tests de servicios, render publico y registro cubren el flujo principal.
