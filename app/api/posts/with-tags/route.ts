import { NextRequest, NextResponse } from 'next/server';
import { fetchPostsWithTagsAndMetadata } from '../../../../lib/blogService';

// Next.js 16: Cache behavior handled via 'use cache' with cacheTag() in blogService

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[API] /api/posts/with-tags - Using blogService...');

    // Use the metadata version which captures timestamp inside the cached function
    const { posts, cachedAt } = await fetchPostsWithTagsAndMetadata();
    const duration = Date.now() - startTime;

    console.log(`[API] /api/posts/with-tags - Completed in ${duration}ms, cached at ${cachedAt}`);

    return NextResponse.json({
      data: posts,
      cache_strategy: 'tags-revalidate-5m',
      duration_ms: duration,
      fetched_at: cachedAt, // Use timestamp from cached function
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
