'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

type ProfileState = { error?: string; message?: string } | null

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autorizado' }

  const parsed = profileSchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    await prisma.user.update({
      where: { id: Number(session.user.id) },
      data: { name: parsed.data.name },
    })
    revalidatePath('/crm/configuracion/perfil')
    return { message: 'Perfil actualizado' }
  } catch {
    return { error: 'Error al actualizar el perfil' }
  }
}

export async function changePassword(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autorizado' }

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { password: true },
  })
  if (!user?.password) return { error: 'Este usuario no tiene contraseña configurada' }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password)
  if (!valid) return { error: 'Contraseña actual incorrecta' }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { password: hashed },
  })

  return { message: 'Contraseña cambiada correctamente' }
}

const VALID_AVATARS = new Set(
  ['avr1', 'avr2', 'avr3', 'avr4', 'avr5', 'avr6'].map((n) => `/avatar/${n}.webp`),
)

export async function updateAvatar(imagePath: string): Promise<ProfileState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'No autorizado' }
  if (!VALID_AVATARS.has(imagePath)) return { error: 'Avatar inválido' }

  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { image: imagePath },
  })

  revalidatePath('/crm', 'layout')
  return { message: 'Avatar actualizado' }
}
