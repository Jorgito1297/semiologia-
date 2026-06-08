import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = pathname === '/' ||
                           pathname.startsWith('/onboarding') ||
                           pathname.startsWith('/faculty') ||
                           pathname.startsWith('/osce') ||
                           pathname.startsWith('/repaso');

  if (isProtectedRoute) {
    const isDemo = request.cookies.get('is_demo')?.value === 'true';
    if (isDemo) {
      return NextResponse.next();
    }

    // Extract project-ref from SUPABASE_URL to construct the correct auth token cookie name
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const projectRef = projectRefMatch?.[1];

    if (!projectRef) {
      console.error('Invalid SUPABASE_URL configuration');
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const authTokenName = `sb-${projectRef}-auth-token`;
    const supabaseToken = request.cookies.get(authTokenName);

    if (!supabaseToken) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
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
