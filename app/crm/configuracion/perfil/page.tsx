import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { TOK } from '@/app/crm/_lib/ui-tokens'
import { Card } from '@/app/crm/_components/ui'
import { ProfileForm } from './_components/ProfileForm'
import { PasswordForm } from './_components/PasswordForm'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { name: true, email: true, role: true },
  })
  if (!user) redirect('/auth/login')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">Mi perfil</h1>

      <Card className="max-w-lg">
        <h2 className={`mb-4 ${TOK.sectionTitle}`}>Información personal</h2>
        <p className="mb-4 text-sm text-[var(--color-on-surface-variant)]">
          {user.email} · <span className="font-medium">{user.role}</span>
        </p>
        <ProfileForm currentName={user.name ?? ''} />
      </Card>

      <Card className="max-w-lg">
        <h2 className={`mb-4 ${TOK.sectionTitle}`}>Cambiar contraseña</h2>
        <PasswordForm />
      </Card>
    </div>
  )
}
