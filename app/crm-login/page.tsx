'use client'

import { useActionState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type LoginState = { error?: string } | null

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/crm/dashboard'

  const [state, action, pending] = useActionState(
    async (_: LoginState, formData: FormData) => {
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        return { error: 'Credenciales incorrectas o cuenta inactiva.' }
      }

      router.push(callbackUrl)
      return null
    },
    null
  )

  return (
    <div className="min-h-screen bg-[#edeef0] flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <span className="text-2xl font-bold tracking-[-0.04em] text-[#080808] mb-8 block text-center">Rui CRM</span>

        <div className="bg-[#f7f8fa] rounded-[32px] border border-[#e5e7eb] p-10">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#080808] mb-2 text-center">Iniciar sesión</h1>
          <p className="text-sm text-[#8a8a8a] mb-8 text-center">Accede a tu panel de control</p>

          <form action={action} className="space-y-0">
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="w-full bg-white rounded-full px-5 py-3 text-sm border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition placeholder:text-[#aaa] mb-3"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-white rounded-full px-5 py-3 text-sm border border-[#f2f2f2] focus:border-[#9ca3af] outline-none transition placeholder:text-[#aaa] mb-3"
              />
            </div>

            {state?.error && (
              <div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-[#080808] text-white rounded-full py-3 text-sm font-semibold hover:bg-[#222] transition border-none cursor-pointer font-sans mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pending ? 'Entrando…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
