# Skill: rsc-patterns

## Cuándo usarla
Decidir si un componente es server o client en Next.js 16 (App Router).

## Reglas
- **Server por defecto.** No agregar `"use client"` salvo necesidad real.
- `"use client"` requerido si usas:
  - `useState`, `useReducer`, `useEffect`, `useRef` (uso DOM).
  - Event handlers DOM (`onClick`, `onChange`, etc).
  - APIs cliente-only (window, document, IntersectionObserver, dnd-kit, editores).
  - Hooks de libs cliente.

## Patrón: page como server, interactividad delegada
```tsx
// app/crm/contactos/page.tsx (server)
import { listContacts } from "@/lib/services/contacts";
import { ContactsTable } from "./_components/ContactsTable"; // client
import { ContactFilters } from "./_components/ContactFilters"; // client

export default async function Page({ searchParams }) {
  const data = await listContacts(parseFilters(searchParams));
  return (
    <div className="space-y-6">
      <ContactFilters initial={searchParams} />
      <ContactsTable rows={data.rows} />
    </div>
  );
}
```

- `ContactsTable` y `ContactFilters` son client porque manejan interacción.
- La página queda server: hace fetch y serializa props.

## Patrón: server action invocada desde client
```tsx
// _components/ContactForm.tsx
"use client";
import { createContact } from "@/lib/services/contacts";

export function ContactForm() {
  async function onSubmit(formData: FormData) {
    const r = await createContact({
      name: formData.get("name"),
      email: formData.get("email"),
    });
    // ...
  }
  return <form action={onSubmit}>...</form>;
}
```

## Boundary correcto
- Lo más alto posible "server"; lo más bajo posible "client".
- Componente cliente puede recibir hijos server vía `children` (componer en server).

```tsx
// Cliente
"use client";
export function Drawer({ children }) {
  const [open, setOpen] = useState(false);
  return open ? <div>{children}</div> : null;
}

// Page (server) compone children server dentro de drawer client
<Drawer>
  <ServerWidget />
</Drawer>
```

## Streaming + Suspense
- Usar `<Suspense fallback={...}>` para secciones lentas.
- Cargar primero lo above-the-fold.

## Caching (Next 16)
- `fetch` sin caché por defecto.
- `revalidatePath` o `revalidateTag` después de mutaciones.
- `cache()` de React para deduplicar lecturas en el mismo request.

## Anti-patrones
- `"use client"` en la página completa.
- Pasar funciones server al cliente como prop (no son serializables).
- `useEffect` para cargar datos cuando el server lo puede hacer.
- Llamar Prisma desde client (imposible, pero gente lo intenta vía abstracciones malas).

## Checklist
- [ ] ¿Necesito interactividad? Si no → server.
- [ ] ¿Puedo bajar la frontera "use client"? Hazlo.
- [ ] ¿Estoy duplicando fetch? Usa `cache()` o pasa data por props.
- [ ] ¿Estoy haciendo fetch en `useEffect` que el server podría hacer? Mueve al server.
