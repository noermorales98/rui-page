# Skill: error-handling

## Cuándo usarla
Toda capa donde puedan ocurrir errores: server actions, webhooks, integraciones, UI.

## Códigos canónicos
Fuente: `docs/sdd/API_SPEC.md §5`.
- `UNAUTHORIZED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `INTEGRATION_ERROR`
- `INTERNAL_ERROR`

## Forma de retorno (server actions)
```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; fields?: Record<string,string[]> } };
```

## Patrón server action
```ts
"use server";
export async function createContact(input: unknown): Promise<Result<Contact>> {
  try {
    const session = await requireRole(["ADMIN","VENDEDOR","ASISTENTE"]);
    const parsed = createContactSchema.safeParse(input);
    if (!parsed.success) {
      return { ok:false, error:{ code:"VALIDATION_ERROR", message:"Datos inválidos", fields: parsed.error.flatten().fieldErrors } };
    }
    const c = await prisma.contact.create({ data: parsed.data });
    await logAudit({ actorId: session.user.id, entityType:"Contact", entityId:c.id, action:"CREATE" });
    return { ok:true, data:c };
  } catch (e) {
    return mapError(e);
  }
}
```

## Mapper
```ts
// lib/errors/map.ts
import { Prisma } from "@prisma/client";
import { AuthError } from "@/lib/auth/permissions";

export function mapError(e: unknown) {
  if (e instanceof AuthError) {
    return { ok:false as const, error:{ code: e.code, message: e.code } };
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return { ok:false, error:{ code:"CONFLICT", message:"Duplicado" } };
    if (e.code === "P2025") return { ok:false, error:{ code:"NOT_FOUND", message:"No encontrado" } };
  }
  console.error("[INTERNAL]", e);
  return { ok:false, error:{ code:"INTERNAL_ERROR", message:"Error inesperado" } };
}
```

## En UI
```tsx
const r = await createContact(values);
if (!r.ok) {
  if (r.error.code === "VALIDATION_ERROR") {
    setFieldErrors(r.error.fields ?? {});
    return;
  }
  toast.error(r.error.message);
  return;
}
toast.success("Contacto creado");
```

## error.tsx por ruta
- Cada segmento puede tener `app/.../error.tsx` (client component).
- Muestra mensaje genérico amigable, botón "reintentar".
- NUNCA exponer detalles internos.

## not-found.tsx
- Páginas con `params` deben llamar `notFound()` cuando el recurso no existe.
- Plantilla común en `app/not-found.tsx`.

## Webhooks
- Verificación de firma falla → 400 sin body.
- Procesamiento falla **tras** verificación → 200 OK (para que el proveedor no re-encole infinito) + log interno.
- Excepción: si el error es transitorio (DB down momentáneo) → 5xx para que reintenten.

## Integraciones externas
- Timeout 10s.
- Retry 2 con backoff exponencial (250ms, 1s).
- Si falla persistente → marcar `Integration.status=ERROR` + notificar.

## Logs
- Solo server. JSON estructurado: `{ level, msg, code, route, actorId }`.
- NUNCA loguear: passwords, tokens completos, payloads completos de webhook con PII.

## Anti-patrones
- `throw new Error("...")` desde server actions sin captura.
- Mostrar stack al usuario.
- Try/catch que solo silencia el error.
- Mismo código de error para causas distintas.
