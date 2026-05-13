# Skill: rate-limit

## Cuándo usarla
Todo endpoint público:
- `/api/forms/[slug]/submit`
- `/api/whatsapp/webhook` (en menor medida; el remitente es Meta)
- Login (`/api/auth/...`)
- Reset password (futuro)
- Cualquier route handler sin sesión.

## Estrategia MVP
- En memoria simple por proceso (Vercel function ephemeral) **NO** es suficiente para producción.
- Recomendado: **Upstash Ratelimit + Redis** (free tier alcanza).
- Alternativa MVP rápida: limite por IP en DB con tabla `RateLimitHit` (cleanup periódico). Menos óptimo pero sin dependencia externa.

## Setup Upstash (recomendado)
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

```ts
// lib/ratelimit/index.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const formSubmitLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "rl:form-submit",
  analytics: true,
});

export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "rl:login",
});
```

## Uso en route handler
```ts
// app/api/forms/[slug]/submit/route.ts
import { formSubmitLimiter } from "@/lib/ratelimit";
import { headers } from "next/headers";

export async function POST(req: Request, ctx) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const { success, remaining, reset } = await formSubmitLimiter.limit(`${ip}:${ctx.params.slug}`);
  if (!success) {
    return Response.json(
      { ok:false, error:{ code:"RATE_LIMITED", message:"Demasiados intentos" } },
      { status: 429, headers: { "X-RateLimit-Reset": String(reset) } },
    );
  }
  // ...procesar
}
```

## Límites recomendados
| Endpoint | Límite | Ventana |
|---|---|---|
| Form submit | 10 | 1 min por IP+slug |
| Form submit por email | 3 | 1 min |
| Login | 5 | 10 min por IP+email |
| Password reset | 3 | 1 hora |
| Webhook stripe | sin límite (firma protege) | - |
| Webhook WA | 1000 | 1 min (sanity) |

## Headers de respuesta
Siempre que rate limit aplique:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

Cuando se bloquea: status `429`.

## Fallback sin Upstash (MVP local)
```ts
// lib/ratelimit/memory.ts (no para prod multi-instancia)
const hits = new Map<string, number[]>();
export function checkMemory(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  if (list.length >= max) return { ok:false };
  list.push(now);
  hits.set(key, list);
  return { ok:true };
}
```
> Aviso: en Vercel cada invocación puede tener memoria distinta. Solo para dev.

## Webhooks externos
- No rate-limitar por IP del proveedor.
- Sí validar firma siempre.

## Captcha (futuro)
- Si el form recibe muchísimo spam: Cloudflare Turnstile en form público.
- No en MVP salvo necesidad.

## Anti-patrones
- Rate limit en `useEffect` cliente (inútil).
- Sin clave única (clave global por endpoint sin IP/usuario).
- 429 sin headers de reset.
- Limitar sesiones autenticadas con la misma cuota que anónimas.
