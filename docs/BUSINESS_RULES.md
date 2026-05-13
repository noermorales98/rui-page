# BUSINESS_RULES — CRM Rui

## 1. Matriz de permisos

| Acción | ADMIN | VENDEDOR | ASISTENTE |
|---|---|---|---|
| Ver dashboard | ✅ | ✅ | ✅ |
| Ver contactos | ✅ | ✅ | ✅ |
| Crear contacto | ✅ | ✅ | ✅ |
| Editar contacto | ✅ | ✅ | ✅ |
| Borrar (soft) contacto | ✅ | ✅ | ❌ |
| Importar CSV | ✅ | ✅ | ✅ |
| Ver pipeline | ✅ | ✅ | ✅ |
| Crear/mover deal | ✅ | ✅ | ❌ |
| Borrar deal | ✅ | ❌ | ❌ |
| Ver ventas | ✅ | ✅ | ❌ |
| Crear venta manual | ✅ | ✅ | ❌ |
| Marcar refund | ✅ | ❌ | ❌ |
| Ver webinars | ✅ | ✅ | ✅ |
| Crear/editar webinar | ✅ | ✅ | ✅ |
| Borrar webinar | ✅ | ❌ | ❌ |
| Ver formularios | ✅ | ✅ | ✅ |
| Crear/editar form | ✅ | ✅ | ✅ |
| Publicar/archivar form | ✅ | ✅ | ❌ |
| Borrar form | ✅ | ❌ | ❌ |
| Ver campañas | ✅ | ✅ | ✅ |
| Crear/editar campaña | ✅ | ✅ | ✅ |
| Enviar campaña | ✅ | ✅ | ❌ |
| Borrar campaña | ✅ | ❌ | ❌ |
| Plantillas / segmentos CRUD | ✅ | ✅ | ❌ |
| Settings → usuarios | ✅ | ❌ | ❌ |
| Settings → integraciones | ✅ | ❌ | ❌ |
| Ver AuditLog | ✅ | ❌ | ❌ |

Helper: `requireRole(["ADMIN","VENDEDOR"])` antes de cada server action sensible.

## 2. Reglas de embudo

### 2.1 Lifecycle de Contact.status
- Default: `NEW`.
- Sube a `QUALIFIED` cuando: el contacto se agrega a un Deal en cualquier etapa, o un Vendedor lo marca manualmente.
- Sube a `CLIENT` cuando: existe al menos un `CrmSale` en estado `PAID` asociado.
- No retrocede automáticamente. Solo ADMIN puede degradar.

### 2.2 Deal stages
- Movimiento libre entre `LEAD → DEMO → NEGOTIATION → ENROLLED`.
- Cuando un Deal pasa a `ENROLLED` sin venta asociada en 7 días → alerta (futuro post-MVP).
- Borrar deal con ventas asociadas: NO permitido (FK protección lógica).

### 2.3 Ventas
- `PAID` desde Stripe webhook es la fuente de verdad para `CLIENT`.
- `REFUNDED` no quita status `CLIENT` automáticamente; queda en historial.
- Una venta manual debe tener `paymentMethod` y `productName`.

### 2.4 Webinars
- Un Contact puede registrarse máximo 1 vez por Webinar (`@@unique`).
- `RegistrationStatus`:
  - `REGISTERED` → al registrarse.
  - `ATTENDED` → cuando Zoom sync o admin marca asistencia.
  - `PURCHASED` → cuando hay venta posterior asociada al contacto + producto del webinar.

### 2.5 Formularios
- Solo forms `PUBLISHED` aceptan submissions en `/api/forms/[slug]/submit`.
- Submission con email duplicado → actualiza contacto existente, no crea otro.
- Submission con teléfono duplicado y sin email → mismo criterio sobre teléfono.
- Lógica condicional: campos con `config.showWhen` no exigidos si la condición no se cumple.

### 2.6 Campañas
- Solo `DRAFT` puede pasar a `SENDING`.
- Antes de enviar: `previewAudience` debe haber sido ejecutado (recipientCount > 0).
- Canal WhatsApp obliga `waTemplateName` aprobada por Meta.
- Canal email obliga `subject` + `bodyHtml`.
- Una vez `SENT`/`PARTIAL`/`FAILED` no se edita; se clona para reenvío.
- `unsubscribe` (futuro): obligatorio en email, opcional WA.

### 2.7 Tags
- Un Contact puede tener N tags. Sin límite hard en MVP.

## 3. Reglas de datos
- Email contacto obligatorio. Validación RFC + dedupe.
- Teléfono: formato E.164 cuando se use WA.
- Soft delete: los registros con `deletedAt != null` NO aparecen en listas estándar ni en métricas del dashboard.
- AuditLog: toda mutación de Deal, CrmSale, CrmCampaign, CrmForm, User, Integration debe loguearse.

## 4. Reglas de comunicación
- SMTP: respetar rate del proveedor (configurable). Reintento exponencial 3 veces.
- WA Cloud: respetar 1000 msg/segundo máx (config Meta). Plantillas en idiomas configurables.

## 5. Reglas de seguridad
- Login: bloqueo tras 5 intentos fallidos en 10 min (rate limit por IP+email).
- Reset de password (futuro): por email con token expirable.
- Sesión: JWT con expiración 7 días, refresh implícito en actividad.

## 6. Reglas financieras
- Moneda default: MXN.
- `amountCents` siempre entero. Conversión en UI.
- Refund: requiere razón en `notes`.
