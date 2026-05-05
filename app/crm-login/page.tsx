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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1320' }}>
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Rui CRM</h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Accede a tu panel de control</p>
        </div>

        <div className="rounded-xl p-8" style={{ background: '#1a1f2e', border: '1px solid #2d3548' }}>
          <form action={action} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                style={{ color: '#94a3b8' }}
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ background: '#0f1320', border: '1px solid #2d3548' }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                style={{ color: '#94a3b8' }}
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ background: '#0f1320', border: '1px solid #2d3548' }}
              />
            </div>

            {state?.error && (
              <p role="alert" className="text-sm text-red-400">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#4f46e5' }}
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
