import { NextRequest, NextResponse } from 'next/server';
import { withSurrogateKey } from '@pantheon-systems/nextjs-cache-handler';
import { cacheTag } from 'next/cache';
import { randomUUID } from 'crypto';

/**
 * CDN cache validation endpoint for E2E tests.
 *
 * GET /cdnprobe
 *
 * Returns a JSON response with a unique generation timestamp and nonce.
 * Uses 'use cache' with cacheTag('cdnprobe') so the cache handler tracks
 * this entry and can clear it from the CDN via revalidatePath/revalidateTag.
 *
 * The withSurrogateKey wrapper ensures the CDN (Fastly) receives a
 * Surrogate-Key header ('cdnprobe'), enabling tag-based CDN purging.
 *
 * Test pattern:
 *   1. Request → cache handler stores entry, CDN caches via Surrogate-Key
 *   2. Wait for CDN Age > 0
 *   3. revalidatePath('/cdnprobe') → cache handler invalidates entry
 *      → onRevalidateComplete → CDN purge via key-based endpoint
 *   4. Request again → origin generates new timestamp
 *   5. Assert new timestamp !== old timestamp → purge worked
 */

async function generateProbeData() {
  'use cache';
  cacheTag('cdnprobe');

  const now = new Date();

  return {
    generated_at: now.toISOString(),
    nonce: randomUUID(),
    purpose: 'CDN cache validation — each origin request produces a unique response',
  };
}

async function handler(_request: NextRequest) {
  const data = await generateProbeData();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=0',
    },
  });
}

export const GET = withSurrogateKey(handler, { debug: true });
