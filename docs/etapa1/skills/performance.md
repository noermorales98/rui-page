# Skill: performance

## Cuándo usarla
Cualquier listado, dashboard, query con joins, o ruta que tarde > 500 ms.

## Principios
1. **Medir antes de optimizar.** Sin métrica → no optimizas.
2. Indices > caché > prefetch > paginación.
3. Server components > client fetching.

## Queries Prisma

### Selecciona solo lo que necesitas
```ts
// Mal
await prisma.contact.findMany();
// Bien
await prisma.contact.findMany({
  select: { id:true, name:true, email:true, status:true, createdAt:true },
});
```

### Evita N+1
- Usar `include` o `select` anidado.
- O `prisma.$transaction([q1, q2, ...])` para paralelizar lecturas independientes.

### Counts y agregados
```ts
const [total, byStatus] = await prisma.$transaction([
  prisma.contact.count({ where: { deletedAt: null } }),
  prisma.contact.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: { _all: true },
  }),
]);
```

### Paginación
- Listas grandes: **cursor pagination** (`cursor + take`).
- UI tipo admin: offset OK hasta ~10k.
- Default `take: 25`, max `take: 100`.

### Índices
- Schema ya incluye los críticos. Antes de agregar uno: ver `EXPLAIN`.
- Compuestos `[a, b]` solo si las queries filtran por ambos juntos.
- `deletedAt` indexado para soft-delete filter.

## Caching

### Request-scope (deduplica)
```ts
import { cache } from "react";
export const getUser = cache(async (id: number) => {
  return prisma.user.findUnique({ where:{id} });
});
```

### Revalidación tras mutación
```ts
import { revalidatePath, revalidateTag } from "next/cache";
// tras crear contacto
revalidatePath("/crm/contactos");
```

### Vercel KV (opcional Etapa post-MVP)
Para dashboard pesado: cachear KPIs 30–60s.

## Server vs Client
- Listados grandes → server component con paginación URL.
- Filtros → `searchParams` en URL, no estado cliente persistente.
- Drag&drop, builders, editores → client con estado optimista.

## Estado optimista
Para mover Deal o reordenar fields:
```ts
const [items, setItems] = useState(initial);
function onMove(prev, next) {
  setItems(next);                 // pinta ya
  startTransition(async () => {
    const r = await moveDeal(...);
    if (!r.ok) setItems(prev);    // revert
  });
}
```

## Bundle
- No instalar libs pesadas sin justificar.
- Importar solo lo necesario (`lodash` está prohibido, usar utils propias).
- Tailwind purge ya viene de v4.
- `next/dynamic` para componentes pesados poco usados (editor RTE).

## Métricas a vigilar
- TTFB páginas autenticadas < 300 ms.
- Render dashboard < 1 s con dataset típico.
- Submission de form público < 500 ms.
- Webhook stripe < 1 s.

## Anti-patrones
- `findMany()` sin select.
- Joins implícitos masivos con `include` profundos.
- Fetch en `useEffect` cuando el server lo puede hacer.
- `JSON.parse(JSON.stringify(...))` para clonar.
- Re-renders por dependencias mal cerradas en hooks.
