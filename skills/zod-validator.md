# Skill: zod-validator

## Cuándo usarla
Cada server action o route handler que reciba input.

## Ubicación
`lib/validators/<dominio>.ts`

## Patrón base
```ts
// lib/validators/contacts.ts
import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(20).optional(),
  source: z.enum(["WEBINAR","FORM","MANUAL","IMPORT"]).default("MANUAL"),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
```

## Uso en server action
```ts
// lib/services/contacts.ts
"use server";
import { createContactSchema } from "@/lib/validators/contacts";

export async function createContact(rawInput: unknown) {
  const parsed = createContactSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION_ERROR",
        message: "Datos inválidos",
        fields: parsed.error.flatten().fieldErrors,
      },
    };
  }
  // ...usar parsed.data
}
```

## Reglas
- `safeParse`, nunca `parse` directo en server actions.
- Inferir tipos con `z.infer<...>` y exportarlos.
- Mensajes en español cortos.
- Schemas reutilizables (no duplicar): `partial()`, `pick()`, `omit()`, `extend()`.
- Para forms con UI: usar el mismo schema con `@hookform/resolvers/zod`.

## Coerción
- IDs numéricos desde URL: `z.coerce.number().int().positive()`.
- Fechas desde input HTML: `z.coerce.date()`.

## Anti-patrones
- Validar dentro del componente cliente sin revalidar en server.
- Aceptar `any` y validar después.
- Validadores redundantes (uno por componente).
