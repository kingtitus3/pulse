import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  // Note: In development, we use a very permissive CSP for Next.js compatibility
  // In production, tighten this significantly
  const isDev = process.env.NODE_ENV === 'development'
  
  // For development, use a very permissive CSP to allow Next.js hot reload and dev features
  // TODO: In production, use strict CSP with nonces
  if (isDev) {
    // Very permissive CSP for development only
    const csp = [
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: http://localhost:* https://localhost:* https://cdn.vercel-insights.com",
      "style-src 'self' 'unsafe-inline' blob: data:",
      "img-src 'self' data: https: http: blob:",
      "connect-src 'self' https://*.supabase.co https://api.tenor.com https://media.tenor.com ws://localhost:* wss://localhost:* http://localhost:* https://localhost:*",
      "media-src 'self' https: http: blob: data:",
      "font-src 'self' data: blob: https: http:",
      "worker-src 'self' blob:",
      "frame-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
    response.headers.set('Content-Security-Policy', csp)
  } else {
    // Production CSP (stricter)
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' https://cdn.vercel-insights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co https://api.tenor.com https://media.tenor.com",
      "media-src 'self' https:",
      "frame-ancestors 'none'",
      "font-src 'self' data:",
    ].join('; ')
    response.headers.set('Content-Security-Policy', csp)
  }
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '0')

  // HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }

  // Session creation is handled in API routes (not in Edge runtime)
  // Check for session cookie and create if missing via /api/session/ensure

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (they handle their own headers)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}

