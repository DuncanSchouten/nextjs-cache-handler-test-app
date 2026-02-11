// Middleware for:
// 1. waitUntil() background task tests (via event.waitUntil())
// 2. Pass-through for other routes (Surrogate-Key headers set by withSurrogateKey wrapper)
//
// See: /api/posts/with-tags/route.ts for example usage of withSurrogateKey

import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Initialize GCS (lazily)
let storage: Storage | null = null;

function getStorage(): Storage {
  if (!storage) {
    storage = new Storage();
  }
  return storage;
}

export function middleware(request: NextRequest, event: NextFetchEvent) {
  // Handle waitUntil() test trigger
  if (request.nextUrl.pathname === '/api/background-tasks/waituntil-trigger') {
    const taskId = request.nextUrl.searchParams.get('taskId');
    const bucketName = process.env.CACHE_BUCKET;

    if (taskId && bucketName) {
      console.log(`[Middleware] waitUntil() triggered: taskId=${taskId}`);

      // Use event.waitUntil() to keep the request alive for background work
      event.waitUntil(
        (async () => {
          try {
            const bucket = getStorage().bucket(bucketName);
            const file = bucket.file(`background-tasks/${taskId}.json`);

            const taskData = {
              taskId,
              type: 'waitUntil',
              completed: true,
              timestamp: Date.now(),
              source: 'middleware',
            };

            await file.save(JSON.stringify(taskData, null, 2), {
              metadata: { contentType: 'application/json' },
            });

            console.log(`[Middleware] waitUntil() completed: taskId=${taskId}`);
          } catch (error) {
            console.error(`[Middleware] waitUntil() failed: taskId=${taskId}`, error);

            // Attempt to write error state
            try {
              const bucket = getStorage().bucket(bucketName);
              const file = bucket.file(`background-tasks/${taskId}.json`);

              const errorData = {
                taskId,
                type: 'waitUntil',
                completed: false,
                timestamp: Date.now(),
                source: 'middleware',
                error: error instanceof Error ? error.message : String(error),
              };

              await file.save(JSON.stringify(errorData, null, 2), {
                metadata: { contentType: 'application/json' },
              });
            } catch {
              // Can't write error state, just log
              console.error(`[Middleware] Failed to write error state: taskId=${taskId}`);
            }
          }
        })()
      );
    } else if (!bucketName) {
      console.warn('[Middleware] CACHE_BUCKET not set - waitUntil() test skipped');
    }
  }

  // Continue to the route handler
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
};
