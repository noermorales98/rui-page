# SDD — CRM Rui

Spec-Driven Development. Estos documentos son la **fuente de verdad** del proyecto. Cualquier agente (humano o IA) debe leerlos antes de tocar código.

## Lectura obligatoria
1. `PRD.md` — qué construimos y para quién.
2. `ARCHITECTURE.md` — stack y capas.
3. `DATA_MODEL.md` — schema y migraciones pendientes.
4. `API_SPEC.md` — server actions, route handlers, errores.
5. `STYLE_GUIDE.md` — tokens Tailwind v4 y componentes UI.
6. `CODE_RULES.md` — convenciones de código y comportamiento de IA.
7. `BUSINESS_RULES.md` — permisos por rol y lógica del embudo.
8. `INTEGRATIONS.md` — Stripe, SMTP, WhatsApp Cloud, Zoom.
9. `ROADMAP.md` — sprints, orden de trabajo, criterios de Done.

## Reglas de actualización
- Si cambia algo del producto, primero se edita el doc correspondiente, luego el código.
- PRs que rompen un doc sin actualizarlo se rechazan.
- Toda decisión técnica con impacto > 1 archivo queda registrada en el doc apropiado.
