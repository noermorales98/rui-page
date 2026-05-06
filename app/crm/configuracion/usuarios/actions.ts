'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['ADMIN', 'EDITOR']),
})

export async function createUser(
  prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return { error: 'No autorizado' }
  }

  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    role: formData.get('role') as string,
  }

  const parsed = createUserSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { error: firstError }
  }

  const { name, email, password, role } = parsed.data
  const hash = await bcrypt.hash(password, 12)

  try {
    await prisma.user.create({
      data: { name, email, password: hash, role },
    })
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return { error: 'El correo ya está en uso' }
    }
    return { error: 'Error al crear el usuario' }
  }

  revalidatePath('/crm/configuracion/usuarios')
  return null
}

export async function deactivateUser(userId: number) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('No autorizado')
  }

  if (String(userId) === String(session.user.id)) {
    throw new Error('No puedes desactivar tu propia cuenta')
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { active: false } })
    revalidatePath('/crm/configuracion/usuarios')
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2025') {
      throw new Error('Usuario no encontrado')
    }
    throw e
  }
}
