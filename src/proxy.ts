import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Migrado de middleware.ts → proxy.ts (Next.js 16 — ver proxy.md en docs)
//
// BUG-02 FIX:
// 1. Usar NEXT_PUBLIC_SUPABASE_URL en lugar de SUPABASE_URL (server-only).
//    En Edge Runtime, las variables sin prefijo NEXT_PUBLIC_ pueden no estar
//    disponibles, causando que TODOS los usuarios sean redirigidos al login.
// 2. Si la env var no está configurada, permitir el paso (fail open) en lugar
//    de redirigir masivamente — el guard real ocurre en cada página.
// 3. Documentado: la validación aquí es superficial (cookie existe). La
//    verificación JWT real ocurre en Supabase SSR en cada Server Component.

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname === '/' ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/faculty') ||
    pathname.startsWith('/osce') ||
    pathname.startsWith('/repaso');

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Demo mode: permitir sin auth
  const isDemo = request.cookies.get('is_demo')?.value === 'true';
  if (isDemo) {
    return NextResponse.next();
  }

  // BUG-02 FIX: Usar NEXT_PUBLIC_SUPABASE_URL (disponible en Edge Runtime)
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const projectRef = projectRefMatch?.[1];

  if (!projectRef) {
    // BUG-02 FIX: Si no hay config, NO redirigir masivamente.
    // Loguear el error y permitir el paso — la auth real se valida en la página.
    console.warn(
      '[Proxy] NEXT_PUBLIC_SUPABASE_URL not configured or invalid. ' +
      'Skipping cookie auth check — pages will handle auth individually.'
    );
    return NextResponse.next();
  }

  const authTokenName = `sb-${projectRef}-auth-token`;
  const supabaseToken = request.cookies.get(authTokenName);

  if (!supabaseToken) {
    // Si la URL contiene parámetros de OAuth (como ?code= o ?error=), se permite
    // el paso para que el cliente (Supabase SDK) procese la autenticación.
    const hasOAuthParams =
      request.nextUrl.searchParams.has('code') ||
      request.nextUrl.searchParams.has('error') ||
      request.nextUrl.searchParams.has('access_token') ||
      request.nextUrl.searchParams.has('refresh_token');

    if (hasOAuthParams) {
      return NextResponse.next();
    }

    const loginUrl = new URL('/login', request.url);
    // Preservar la URL de destino para redirect post-login
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/onboarding/:path*',
    '/faculty/:path*',
    '/osce/:path*',
    '/repaso/:path*',
  ],
};
