# Skill: csv-import

## Cuándo usarla
Cualquier import CSV (contactos, leads, etc).

## Lib
`papaparse` (cliente) o `csv-parse` (servidor, streaming).
Recomendado para MVP: **server-side con `csv-parse`** para archivos > 1MB.

## Reglas
- Validar archivo: MIME `text/csv` o extensión `.csv`. Max 5MB MVP.
- Detectar separador (`,` o `;`) y encoding (UTF-8, fallback Latin-1).
- Header obligatorio en primera fila.
- Validar **fila por fila** con Zod, sin abortar al primer error.
- Reporte final estructurado.

## Estructura import contactos
```ts
// lib/services/contacts.import.ts
import { parse } from "csv-parse/sync";
import { createContactSchema } from "@/lib/validators/contacts";

type ImportResult = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; field?: string; message: string }>;
};

export async function importContactsCsv(buffer: Buffer): Promise<ImportResult> {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];

  const result: ImportResult = { inserted:0, updated:0, skipped:0, errors:[] };

  await prisma.$transaction(async (tx) => {
    for (const [i, row] of records.entries()) {
      const parsed = createContactSchema.safeParse({
        name: row.name ?? row.nombre,
        email: row.email ?? row.correo,
        phone: row.phone ?? row.telefono,
        source: (row.source ?? "IMPORT").toUpperCase(),
      });
      if (!parsed.success) {
        const fld = Object.keys(parsed.error.flatten().fieldErrors)[0];
        result.errors.push({ row: i+2, field: fld, message: "Datos inválidos" });
        continue;
      }
      const exists = await tx.contact.findUnique({ where: { email: parsed.data.email } });
      if (exists) {
        await tx.contact.update({ where:{id:exists.id}, data: parsed.data });
        result.updated++;
      } else {
        await tx.contact.create({ data: parsed.data });
        result.inserted++;
      }
    }
  }, { timeout: 60_000 });

  return result;
}
```

## Encabezados aceptados
- Aceptar variantes ES y EN: `name|nombre`, `email|correo`, `phone|telefono`, `source|fuente`.
- Normalizar a llaves canónicas antes de validar.

## Reporte UI
- Tabla resumen: `Insertados: X`, `Actualizados: Y`, `Errores: Z`.
- Lista de errores con número de fila + razón.
- Botón "Descargar errores" → CSV con filas problemáticas.

## Reglas duras
- Una sola transacción salvo que el archivo sea muy grande (> 5000 filas) → batches de 500.
- Validar **email único** dentro del propio CSV (dedupe inter-archivo): si hay dos filas con mismo email, registrar advertencia y procesar la primera.
- No insertar registros parcialmente válidos: si falta un campo requerido → skip + error.
- AuditLog: 1 entrada `IMPORT` con `metadata.count`.

## Performance
- > 5000 filas: streaming + batches de 500.
- Indexar `Contact.email` (ya está unique → automático).
- Bulk insert con `createMany` solo si todos los registros son nuevos (no soporta upsert en MySQL).

## Anti-patrones
- Cargar todo en memoria sin límite.
- Insertar uno por uno con `await` sin batch ni transacción.
- Reportar solo "X errores" sin detalle de filas.
- Aceptar formato Excel (xlsx) en esta skill (otra ruta separada si se requiere).
