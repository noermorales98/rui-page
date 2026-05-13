# Skill: prisma-migration

## Cuándo usarla
Cualquier cambio a `prisma/schema.prisma`.

## Reglas duras
- Toda modificación de schema actualiza también `docs/sdd/DATA_MODEL.md` en el **mismo PR**.
- Nunca borrar columnas sin un paso intermedio (migration vacía + deprecación).
- Soft delete (`deletedAt`) no se elimina con DROP; se ignora en queries.
- Renames: usar `@map` y migración manual revisada.

## Pasos
1. Leer `DATA_MODEL.md` para confirmar el cambio cabe en la convención.
2. Editar `schema.prisma`.
3. Generar migración:
   ```bash
   pnpm prisma migrate dev --name <descriptive_name>
   ```
4. Revisar SQL generado en `prisma/migrations/<timestamp>/migration.sql`. Si rompe datos: editar manualmente.
5. Ejecutar `pnpm prisma generate`.
6. Actualizar `DATA_MODEL.md`.
7. Si afecta a un servicio: actualizar `API_SPEC.md` también.

## Backfill
Para añadir columnas not-null sin default: migración en 3 pasos:
1. Agregar como nullable.
2. Backfill datos (script en `prisma/scripts/`).
3. Hacer not-null.

## Convenciones
- Índices: declarados en el modelo, no en migración manual.
- Enums: en lugar de strings cuando hay set fijo conocido.
- FKs: siempre con `onDelete` explícito.

## Cosas prohibidas
- `prisma db push` en main.
- Migraciones sin nombre.
- Tocar migraciones ya aplicadas en otro entorno.
