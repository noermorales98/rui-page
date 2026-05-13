# PRD — CRM Rui Machalele

## 1. Visión
CRM custom para gestionar el embudo de ventas del programa "Expansión Mental". Captura leads (formularios, webinars, import, manual), los califica, los mueve por un pipeline comercial, registra la venta y permite seguimiento por email y WhatsApp.

## 2. Usuarios y roles
- **Admin** — acceso total, gestiona usuarios, integraciones, ajustes globales.
- **Vendedor** — opera contactos, pipeline, ventas, llamadas, registra deals.
- **Asistente** — captura contactos, envía campañas, gestiona formularios y webinars; sin acceso a configuraciones críticas ni a borrar registros.

## 3. Alcance MVP
7 módulos: dashboard, contactos, pipeline, ventas, webinars, formularios, campañas.

### 3.1 Dashboard
- Métricas en tiempo real: contactos totales, ingresos pagados, pipeline abierto, webinars próximos, respuestas de formularios, emails enviados.
- Feed de actividad reciente por contacto.

### 3.2 Contactos
- CRUD + import CSV.
- Filtros: estado (NEW/QUALIFIED/CLIENT), fuente (WEBINAR/FORM/MANUAL/IMPORT).
- Tags y segmentación.
- Vista de detalle con timeline de actividad.

### 3.3 Pipeline
- Kanban con etapas fijas: LEAD → DEMO → NEGOTIATION → ENROLLED.
- Drag & drop entre etapas.
- Creación manual de oportunidad (Deal) desde un contacto.

### 3.4 Ventas
- Registro manual y automático (Stripe webhook).
- Métricas: ingresos pagados, ticket promedio, pendientes, reembolsos.
- Filtros por estado y método de pago.

### 3.5 Webinars
- Alta manual.
- Integración Zoom (sync de registros y asistencia).
- Streamyard: registro manual.
- Métricas: registrados, asistentes, compradores.

### 3.6 Formularios
- Constructor drag & drop con lógica condicional.
- Tipos: SHORT_TEXT, FULL_NAME, PHONE, PHONE_WITH_COUNTRY, EMAIL, CUSTOM_DATE, CUSTOM_TIME, CUSTOM_DATETIME.
- Publicación: URL pública + embed iframe.
- Submission crea/actualiza Contact automáticamente.

### 3.7 Campañas
- Canales: email (SMTP propio) y WhatsApp (Cloud API Meta).
- Segmentación dinámica (Segment reutilizable o filtros inline).
- Plantillas reutilizables (CampaignTemplate).
- Flujo: borrador → revisar audiencia → enviar.

## 4. Fuera de alcance MVP
- Multi-tenant.
- App móvil nativa.
- Automatizaciones (workflows tipo Zapier).
- Reporting avanzado/BI.
- SMS.
- Integraciones con calendarios.

## 5. Métricas de éxito MVP
- Tiempo de captura de lead < 5s desde submit.
- Sync Zoom < 5 min tras webinar.
- Envío campaña 1000 destinatarios < 10 min.
- 0 leaks de datos entre roles.

## 6. Restricciones técnicas
- Stack fijo (ver `ARCHITECTURE.md`).
- Despliegue Vercel.
- DB MariaDB en Hostinger.
- Costos operativos bajos (Free tier donde sea posible).
