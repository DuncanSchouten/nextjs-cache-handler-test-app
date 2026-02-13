import { NextRequest, NextResponse } from 'next/server';
import { cacheTag } from 'next/cache';
import { randomUUID } from 'crypto';

/**
 * CDN cache validation endpoint for E2E tests.
 *
 * GET /cdnprobe
 *
 * Returns a JSON response with a unique generation timestamp and nonce.
 * Uses 'use cache' with cacheTag('cdnprobe') so the cache handler tracks
 * this entry and can clear it via revalidatePath/revalidateTag.
 *
 * Sets the Surrogate-Key header explicitly to 'cdnprobe' so the CDN
 * (Fastly) can purge this response via key-based invalidation when
 * onRevalidateComplete fires.
 *
 * Test pattern:
 *   1. Request → cache handler stores entry, CDN caches with Surrogate-Key
 *   2. Wait for CDN Age > 0
 *   3. revalidatePath('/cdnprobe') → cache handler invalidates entry
 *      → onRevalidateComplete → CDN purge via DELETE /cache/keys/cdnprobe
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

export async function GET(_request: NextRequest) {
  const data = await generateProbeData();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=0',
      'Surrogate-Key': 'cdnprobe',
    },
  });
}
