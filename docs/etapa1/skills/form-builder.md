# Skill: form-builder

## Cuándo usarla
Trabajo dentro del builder visual de formularios (`module-forms`).

## Pre-lectura
- `module-forms.md`
- `ui-component.md`
- `zod-validator.md`

## Arquitectura del builder
3 zonas en cliente:
1. **Paleta** (`FieldPalette`) — tipos disponibles, draggables.
2. **Canvas** (`FieldCanvas`) — campos ordenados, sortables.
3. **Editor** (`FieldEditor`) — props del campo seleccionado.

Estado en cliente:
```ts
type BuilderField = {
  tempId: string;     // uuid local antes de guardar
  id?: number;        // server id si ya guardado
  type: CrmFormFieldType;
  contactTarget: CrmFormContactTarget;
  label: string;
  fieldKey: string;   // slugified
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  position: number;
  config?: {
    showWhen?: { fieldKey: string; op: Op; value: string | string[] };
  };
};
```

## fieldKey auto
- Generar desde `label` con slug minúsculas + `_`.
- Garantizar único por form. Si choca → sufijo `_2`.
- Inmutable después de tener submissions (UI bloquea edición).

## Lógica condicional
- Editor muestra: campo origen (select de campos previos), op (eq/neq/in/notIn/empty/notEmpty), valor.
- Solo puede depender de campos **anteriores** en posición.
- Evaluador (compartido cliente y servidor) en `lib/forms/conditional.ts`:
  ```ts
  export function shouldShow(
    field: BuilderField,
    values: Record<string, unknown>,
  ): boolean {
    const cond = field.config?.showWhen;
    if (!cond) return true;
    const v = values[cond.fieldKey];
    switch (cond.op) {
      case "eq": return v === cond.value;
      case "neq": return v !== cond.value;
      case "in": return Array.isArray(cond.value) && cond.value.includes(v as string);
      case "notIn": return Array.isArray(cond.value) && !cond.value.includes(v as string);
      case "empty": return v === undefined || v === null || v === "";
      case "notEmpty": return !(v === undefined || v === null || v === "");
      default: return true;
    }
  }
  ```

## Drag & drop
- `@dnd-kit/core` + `SortableContext` en canvas.
- Paleta usa `useDraggable` con clones (no se reordena ahí).
- `onDragEnd`:
  - Origen paleta → canvas: crear nuevo `BuilderField`.
  - Origen canvas → canvas: reordenar `position`.

## Persistencia
- Botón "Guardar" → server action `saveFormFields(formId, fields)`:
  1. Validar con Zod.
  2. Diff con DB: insertar nuevos, actualizar existentes, soft-delete los que ya no están.
  3. Transacción Prisma.

## Preview en tiempo real
- Componente `FormPreview` renderiza fields según `shouldShow`.
- Mismo motor de render que la página pública.

## Validación dinámica al submit
- Construir schema Zod en runtime desde fields visibles según valores actuales.
- Required solo si `shouldShow(field, values) === true`.

## UI rules
- Editor solo aparece cuando hay campo seleccionado.
- Atajos teclado:
  - `Delete` borra campo seleccionado.
  - `Esc` deselecciona.

## Done
- 3 zonas funcionales.
- Condicional muestra/oculta sin lag.
- Guardar persiste todo correctamente.
- Preview coincide con vista pública.
