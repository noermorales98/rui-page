# Skill: reviewer-agent

## Cuándo usarla
Cuando un agente termina una rama y otro agente debe revisar antes del humano.

## Objetivo
Generar **un reporte estructurado** que el humano revisa en 2–5 minutos.

## Pre-lectura
- `sdd-loader` completo.
- La(s) skill(s) del módulo modificado.

## Pasos
1. `git diff main..HEAD` para ver cambios.
2. Por cada archivo modificado, evaluar:
   - ¿Respeta `CODE_RULES.md`?
   - ¿Servicios cumplen `API_SPEC.md`?
   - ¿Schema sigue `DATA_MODEL.md`?
   - ¿Permisos según `BUSINESS_RULES.md`?
   - ¿UI usa tokens de `STYLE_GUIDE.md`?
   - ¿Integraciones según `INTEGRATIONS.md`?
3. Buscar:
   - Server actions sin `requireRole`.
   - Mutaciones sin `AuditLog` cuando aplica.
   - Inputs sin Zod.
   - `any` no justificado.
   - Imports nuevos sin actualizar `package.json` / `ARCHITECTURE.md`.
   - Soft delete no respetado en lectura.
   - Falta de tests en feature crítica.

## Formato del reporte
```md
# Reporte de revisión — branch `<branch>`

## ✅ Bien
- ...

## ⚠️ Advertencias (no bloqueantes)
- archivo:linea — razón.

## ❌ Bloqueantes
- archivo:linea — razón + cómo arreglar.

## 📋 Pendientes detectados
- TODO en `xxx.ts:42` — sin issue.
- Falta test e2e del flujo Y.

## 🧪 Tests sugeridos
- Caso X no cubierto.

## 📝 Actualizaciones de docs requeridas
- `DATA_MODEL.md` no refleja el campo Z agregado.
```

## Reglas
- No editar código en revisión; solo reportar.
- Si un bloqueante existe → status del PR: NEEDS_CHANGES.
- Si solo advertencias → APPROVED_WITH_NOTES.
- Si nada → APPROVED.
- Output final del agente: comentario en PR o archivo `.review/<branch>.md`.

## Anti-patrones
- Reseñas vagas ("podría mejorar").
- Lista de nice-to-haves disfrazados de bloqueantes.
- Aprobar sin haber leído los docs SDD.
