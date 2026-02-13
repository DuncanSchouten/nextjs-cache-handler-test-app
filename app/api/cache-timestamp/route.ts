import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * CDN cache validation endpoint for E2E tests.
 *
 * GET /api/cache-timestamp
 *
 * Returns a JSON response with a unique generation timestamp and nonce.
 * Every request that reaches the origin produces a new timestamp.
 * The CDN (Fastly) caches the response via s-maxage.
 *
 * Test pattern:
 *   1. Request → CDN caches response with timestamp A
 *   2. Wait for Age > 0
 *   3. Purge CDN path
 *   4. Request again → origin generates timestamp B
 *   5. Assert timestamp B !== timestamp A → purge worked
 *
 * This endpoint intentionally avoids 'use cache', cacheLife, and
 * revalidateTag to provide a simple, deterministic CDN caching target.
 */
export async function GET() {
  const now = new Date();

  return NextResponse.json(
    {
      generated_at: now.toISOString(),
      nonce: randomUUID(),
      purpose: 'CDN cache validation — each origin request produces a unique response',
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=0',
      },
    }
  );
}
