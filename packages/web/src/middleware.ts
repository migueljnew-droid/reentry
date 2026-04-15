import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit, getTier } from '@/lib/rate-limit';

const PUBLIC_PATHS = ['/api/health'];

// Demo / fixture endpoints — no real user data, safe to expose for MVP dashboards.
// Remove as each endpoint is wired to real auth'd user context.
const PUBLIC_PREFIXES = [
  '/api/po/',               // Caseload + compliance-report fixtures
  '/api/employment/match',  // Fair-chance matcher (stateless search)
  '/api/resources',         // 211.org stub
  '/api/intake/voice',      // Voice intake FSM
  '/api/deadlines',         // Deadline cascade compute (stateless)
];

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=()'
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for public paths (exact match)
  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Skip auth for fixture/demo prefixes (no user PII)
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Skip auth for non-API routes (pages served by Next.js)
  if (!pathname.startsWith('/api/')) {
    return addSecurityHeaders(NextResponse.next());
  }

  // CORS: allow production domain + localhost in dev
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
  ].filter(Boolean);

  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse('CORS: Origin not allowed', { status: 403 });
  }

  // Rate limit auth routes by IP (before auth check)
  const tier = getTier(pathname);
  if (tier === 'auth') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rlResult = await checkRateLimit(ip, 'auth');
    if (rlResult && !rlResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rlResult.retryAfterSeconds),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rlResult.reset),
          },
        }
      );
    }
  }

  // JWT validation via Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // No Supabase configured — allow through (dev mode)
    return addSecurityHeaders(NextResponse.next());
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: Record<string, unknown> }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized — valid session required' },
      { status: 401 }
    );
  }

  // Rate limit authenticated routes by user ID (AI and general tiers)
  if (tier !== 'auth') {
    const rlResult = await checkRateLimit(user.id, tier);
    if (rlResult && !rlResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rlResult.retryAfterSeconds),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rlResult.reset),
          },
        }
      );
    }
    if (rlResult) {
      response.headers.set('X-RateLimit-Remaining', String(rlResult.remaining));
      response.headers.set('X-RateLimit-Reset', String(rlResult.reset));
    }
  }

  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
