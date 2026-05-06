import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? '',
  })

  const isLoggedIn = !!token
  const isCrmRoute = request.nextUrl.pathname.startsWith('/crm')
  const isLoginPage = request.nextUrl.pathname === '/crm-login'

  if (isCrmRoute && !isLoggedIn) {
    const loginUrl = new URL('/crm-login', request.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/crm/dashboard', request.nextUrl.origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/crm/:path*', '/crm-login'],
}
