# Skill: sdd-loader

## Cuándo usarla
Al inicio de **cualquier** tarea, antes de leer código o tocar archivos.

## Qué hace
Carga el contexto SDD para que cualquier decisión técnica respete la fuente de verdad.

## Pasos
1. Leer en orden:
   - `docs/sdd/PRD.md`
   - `docs/sdd/ARCHITECTURE.md`
   - `docs/sdd/DATA_MODEL.md`
   - `docs/sdd/API_SPEC.md`
   - `docs/sdd/STYLE_GUIDE.md`
   - `docs/sdd/CODE_RULES.md`
   - `docs/sdd/BUSINESS_RULES.md`
   - `docs/sdd/INTEGRATIONS.md`
   - `docs/sdd/ROADMAP.md`
2. Cargar también la skill específica del módulo a trabajar si existe (`skills/module-*.md`).
3. Resumir mentalmente: alcance MVP, stack, roles, módulo objetivo.

## Reglas
- Si un doc contradice el código existente: el **doc gana**. Reportar la inconsistencia.
- Si falta info en docs: preguntar al humano antes de inventar.
- No proceder hasta haber leído los docs relevantes.

## Output esperado
Un mensaje corto al usuario:
> "SDD cargado. Trabajando en [módulo X] siguiendo [docs relevantes]. Plan: [3–5 bullets]."
