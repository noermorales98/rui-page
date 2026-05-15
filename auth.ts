import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(255),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user || !user.active || user.deletedAt) return null

        const passwordMatch = await bcrypt.compare(parsed.data.password, user.password)
        if (!passwordMatch) return null

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    authorized: async ({ request, auth: session }) => {
      const isLoginPage = request.nextUrl.pathname === '/crm-login'
      const isAuthenticated = !!session?.user

      // Redirect logged-in users away from the login page
      if (isLoginPage && isAuthenticated) {
        return Response.redirect(new URL('/crm/dashboard', request.nextUrl))
      }

      // Allow authenticated users through; reject others (Auth.js will redirect to signIn page)
      return isAuthenticated
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id
      if (token.role) session.user.role = token.role
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: '/crm-login',
  },
})
