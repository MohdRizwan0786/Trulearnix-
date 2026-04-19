import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MAINTENANCE_EXEMPT = ['/maintenance', '/_next', '/favicon', '/api', '/apple-touch-icon']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip exempt paths
  if (MAINTENANCE_EXEMPT.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  try {
    const internalApiUrl = process.env.INTERNAL_API_URL || 'http://localhost:5000'
    const res = await fetch(`${internalApiUrl}/api/public/maintenance`, { cache: 'no-store' })
    const data = await res.json()

    if (data.maintenanceMode) {
      // Check early access token — from query param or cookie
      if (data.earlyAccessEnabled) {
        const qToken = request.nextUrl.searchParams.get('early_access')
        const cToken = request.cookies.get('ea_token')?.value
        const eaToken = qToken || cToken

        if (eaToken) {
          const vRes = await fetch(`${internalApiUrl}/api/public/validate-early-access?token=${encodeURIComponent(eaToken)}`, { cache: 'no-store' })
          const vData = await vRes.json()
          if (vData.valid) {
            const response = NextResponse.next()
            // Persist token in cookie if it came from query param
            if (qToken) {
              response.cookies.set('ea_token', qToken, {
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60, // 7 days
                path: '/',
              })
            }
            return response
          }
        }
      }

      // No valid early access — show maintenance page
      const url = request.nextUrl.clone()
      url.pathname = '/maintenance'
      return NextResponse.rewrite(url)
    }
  } catch {
    // If API is down, don't block users
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
