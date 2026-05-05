import { auth } from './auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isCrmRoute = req.nextUrl.pathname.startsWith('/crm')
  const isLoginPage = req.nextUrl.pathname === '/crm-login'

  if (isCrmRoute && !isLoggedIn) {
    const loginUrl = new URL('/crm-login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/crm/dashboard', req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/crm/:path*', '/crm-login'],
}
