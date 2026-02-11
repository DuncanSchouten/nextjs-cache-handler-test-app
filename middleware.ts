// Middleware disabled - using withSurrogateKey wrapper on route handlers instead.
// Kevin's middleware approach doesn't work because middleware runs BEFORE routes,
// so cache tags aren't captured yet. The wrapper approach sets headers AFTER
// the route completes and tags have been captured.
//
// See: /api/posts/with-tags/route.ts for example usage of withSurrogateKey

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple pass-through - Surrogate-Key headers are set by withSurrogateKey wrapper
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
};
