import { NextRequest, NextResponse } from 'next/server';
import { fetchPostsWithTags } from '../../../../lib/blogService';

// Mark route as dynamic to ensure fresh execution
// (Fetch cache will still work, but route won't be pre-rendered)
export const dynamic = 'force-dynamic';

// Disable CDN caching for API routes to prevent stale responses after revalidation
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[API] /api/posts/with-tags - Using blogService...');

    const posts = await fetchPostsWithTags();
    const duration = Date.now() - startTime;

    console.log(`[API] /api/posts/with-tags - Completed in ${duration}ms`);

    return NextResponse.json({
      data: posts,
      cache_strategy: 'tags-revalidate-5m',
      duration_ms: duration,
      fetched_at: new Date().toISOString(),
      tags: ['api-posts', 'external-data'],
      description: 'Cached for 5 minutes with tags for on-demand invalidation'
    }, {
      headers: {
        // Prevent CDN from caching API responses
        // This ensures revalidateTag() effects are immediately visible
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('[API] /api/posts/with-tags - Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch posts',
        cache_strategy: 'tags-revalidate-5m',
        duration_ms: Date.now() - startTime,
        fetched_at: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
