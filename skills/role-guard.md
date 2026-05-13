# Skill: role-guard

## Cuándo usarla
Toda server action y route handler privado.

## Helper
`lib/auth/permissions.ts`:
```ts
import { auth } from "@/auth";
import type { Role } from "@prisma/client";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(allowed: Role[]) {
  const session = await requireSession();
  if (!allowed.includes(session.user.role)) {
    throw new AuthError("FORBIDDEN");
  }
  return session;
}

export class AuthError extends Error {
  constructor(public code: "UNAUTHORIZED" | "FORBIDDEN") {
    super(code);
  }
}
```

## Uso
```ts
"use server";
import { requireRole } from "@/lib/auth/permissions";

export async function deleteContact(id: number) {
  const session = await requireRole(["ADMIN","VENDEDOR"]);
  // ...
}
```

## Wrapper recomendado
```ts
// lib/services/_wrap.ts
export function withAuth<T extends (...a:any)=>any>(
  roles: Role[],
  fn: T
): T {
  return (async (...args:any) => {
    try {
      const session = await requireRole(roles);
      return await fn(session, ...args);
    } catch (e) {
      if (e instanceof AuthError) {
        return { ok:false, error:{ code:e.code, message:e.code } };
      }
      throw e;
    }
  }) as T;
}
```

## Matriz autoritativa
`docs/sdd/BUSINESS_RULES.md` §1. Cualquier discrepancia entre código y matriz: actualizar el doc o el código.

## Reglas
- Primera línea funcional de cada server action: `requireRole(...)`.
- Endpoints públicos (form submit, webhooks): no usar `requireRole`; usar verificación específica (rate limit, firma).
- Tests deben cubrir: rol con permiso → ok, rol sin permiso → FORBIDDEN, sin sesión → UNAUTHORIZED.
