import Image from 'next/image'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { Card } from '@/app/crm/_components/ui'
import { ProfileForm } from './_components/ProfileForm'
import { PasswordForm } from './_components/PasswordForm'
import { AvatarPicker } from './_components/AvatarPicker'

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  ASISTENTE: 'Asistente',
}

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { name: true, email: true, role: true, image: true },
  })
  if (!user) redirect('/auth/login')

  const initials = (user.name ?? '')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_1fr]">

      {/* ── Columna izquierda: info de cuenta ── */}
      <Card className="lg:sticky lg:top-[96px]">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          {/* Avatar */}
          {user.image ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-[var(--color-accent-neon)] ring-offset-2">
              <Image src={user.image} alt={user.name ?? 'Avatar'} fill sizes="80px" className="object-cover" />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent-neon)] text-2xl font-bold text-[var(--color-on-surface)]">
              {initials}
            </div>
          )}

          <div>
            <p className="text-[17px] font-semibold text-[var(--color-on-surface)]">{user.name}</p>
            <p className="mt-0.5 text-sm text-[var(--color-on-surface-variant)]">{user.email}</p>
          </div>

          <span className="rounded-full bg-[var(--color-primary-fixed-dim)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-on-surface)]">
            {ROLE_LABEL[user.role] ?? user.role}
          </span>
        </div>

        <div className="mt-4 border-t border-[var(--color-surface-container-high)] pt-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className={TOK.label}>Correo electrónico</dt>
              <dd className="mt-0.5 text-[var(--color-on-surface)]">{user.email}</dd>
            </div>
            <div>
              <dt className={TOK.label}>Rol</dt>
              <dd className="mt-0.5 text-[var(--color-on-surface)]">{ROLE_LABEL[user.role] ?? user.role}</dd>
            </div>
          </dl>
        </div>
      </Card>

      {/* ── Columna derecha: formularios ── */}
      <div className="flex flex-col gap-6">
        <Card>
          <h2 className={`mb-5 ${TOK.sectionTitle}`}>Foto de perfil</h2>
          <AvatarPicker currentImage={user.image ?? null} />
        </Card>

        <Card>
          <h2 className={`mb-5 ${TOK.sectionTitle}`}>Información personal</h2>
          <ProfileForm currentName={user.name ?? ''} />
        </Card>

        <Card>
          <h2 className={`mb-5 ${TOK.sectionTitle}`}>Cambiar contraseña</h2>
          <PasswordForm />
        </Card>
      </div>
    </div>
  )
}
