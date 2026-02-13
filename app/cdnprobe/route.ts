import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * CDN cache validation endpoint for E2E tests.
 *
 * GET /cdnprobe
 *
 * Returns a JSON response with a unique generation timestamp and nonce.
 * Every request that reaches the origin produces a new timestamp.
 * The CDN (Fastly) caches the response via s-maxage.
 *
 * Single-segment path is required because the outbound proxy's
 * DELETE /rest/v0alpha1/cache/paths/{path} endpoint returns 404
 * for multi-segment paths like /api/cache-timestamp.
 *
 * Test pattern:
 *   1. Request → CDN caches response with timestamp A
 *   2. Wait for Age > 0
 *   3. Purge CDN path /cdnprobe
 *   4. Request again → origin generates timestamp B
 *   5. Assert timestamp B !== timestamp A → purge worked
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
