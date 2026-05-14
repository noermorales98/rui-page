# Rotación de credenciales — Mayo 2026

Las siguientes credenciales aparecieron en chat con un agente IA y deben rotarse.
NEXTAUTH_SECRET ya se rotó automáticamente en `lib/.env`; el resto requiere
acción manual en paneles externos.

## Estado

| Credencial | Estado | Acción |
|---|---|---|
| `NEXTAUTH_SECRET` | ✅ Rotado | Nada — sesión invalidada, sólo re-loguearse. |
| `DATABASE_URL` password | ⚠️ Pendiente | Hostinger panel → MySQL. |
| `SMTP_PASS` | ⚠️ Pendiente | Hostinger panel → Emails. |
| GitHub OAuth token | ⚠️ Pendiente | github.com/settings/applications. |

---

## 1. DATABASE_URL — password MariaDB en Hostinger

1. Entrá a [hpanel.hostinger.com](https://hpanel.hostinger.com).
2. **Bases de Datos** → buscar `u627288392_ruicrm` → **Cambiar contraseña** → generar una nueva (mínimo 16 chars, evitá `@`, `:`, `/`, `?`, `#` que rompen el URI parser; o usa percent-encoding).
3. Copiar el nuevo password.
4. Editar `.env` localmente:
   ```env
   DATABASE_URL="mysql://u627288392_ruicrm:<NUEVO_PASSWORD>@82.197.82.158:3306/u627288392_ruicrm"
   ```
5. Verificar:
   ```bash
   npm run db:status
   ```
   Debe responder `Database schema is up to date!`.
6. **Vercel** (si tenés deploy): Project Settings → Environment Variables → editar `DATABASE_URL` con el nuevo valor. Redeploy.

## 2. SMTP_PASS — password del buzón Hostinger

1. Hostinger → **Emails** → `contacto@ruimachaleleoficial.com` → **Cambiar contraseña**.
2. Editar `.env`:
   ```env
   SMTP_PASS=<NUEVO_PASSWORD>
   ```
3. Verificar enviando una campaña/prueba (cuando Sprint 8 esté operativo) o vía `nodemailer` script ad-hoc.
4. Actualizar en Vercel si aplica.

## 3. GitHub OAuth token

El token con prefijo `gho_` que estaba en tu git credential helper proviene de una **OAuth App** autorizada en tu cuenta (probablemente VS Code, GitHub Desktop, gh CLI, o el navegador). Para revocarlo:

1. Entrá a [github.com/settings/applications](https://github.com/settings/applications) — pestaña **Authorized OAuth Apps**.
2. Revisá la lista y **revocá la app** que veas con permisos amplios sobre `repo` (probablemente `Git Credential Manager`, `GitHub CLI` o `Visual Studio Code`).
3. La próxima vez que tu git/CLI haga push/pull, te va a pedir re-autenticarte y emitirá un token nuevo.

Si era un PAT (Personal Access Token) en lugar de OAuth, sería `ghp_…`. Tu prefijo es `gho_` → OAuth.

## 4. (Opcional) Re-rotar NEXTAUTH_SECRET

Ya está rotado, pero si querés total paranoia:

```bash
NEW=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
node -e "
const fs=require('fs');
const path='.env';
const v=process.env.NEW;
const src=fs.readFileSync(path,'utf8');
fs.writeFileSync(path, src.replace(/^NEXTAUTH_SECRET=.*$/m, 'NEXTAUTH_SECRET=\"'+v+'\"'));
console.log('rotated');
" 
unset NEW
```

Y reinstalar la cookie de sesión (todos los usuarios re-loguean).

---

## Después de rotar

- Borrá este archivo o muévelo a `docs/superpowers/archive/` para que no quede en el repo público.
- Si seguís encontrando el password viejo en logs o caches, rotalo de nuevo.
