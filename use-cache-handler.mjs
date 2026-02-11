// Use cache handler configuration for Next.js 16 'use cache' directive
// Uses @pantheon-systems/nextjs-cache-handler cacheHandlers (plural) support
//
// This handler enables Surrogate-Key header propagation for CDN cache invalidation
// when using 'use cache: remote' directive for runtime caching.
//
// Architecture:
// - Tags set via cacheTag() are stored with cache entries
// - On cache HIT, tags are propagated to withSurrogateKey() wrapper
// - withSurrogateKey() sets Surrogate-Key response header for CDN integration
//
// Note: Uses globalThis fallback because Next.js cache mechanism runs
// outside of AsyncLocalStorage context created by withSurrogateKey().

import { createUseCacheHandler, RequestContext } from '@pantheon-systems/nextjs-cache-handler';

// Global tag store for cross-context tag propagation
// Fallback for when AsyncLocalStorage doesn't propagate through Next.js cache mechanism
globalThis.__pantheonSurrogateKeyTags = globalThis.__pantheonSurrogateKeyTags || [];

// Get the handler class based on environment
const UseCacheHandlerClass = createUseCacheHandler({
  type: 'auto', // Auto-detect: GCS if CACHE_BUCKET is set, otherwise file-based
});

// Next.js expects an object with handler methods, so we instantiate the class
const handler = new UseCacheHandlerClass();

// Wrap get() to propagate cache tags for Surrogate-Key headers
const wrappedGet = async (cacheKey, softTags) => {
  const result = await handler.get(cacheKey, softTags);

  // On cache HIT with tags, propagate to response wrapper
  if (result && result.tags && result.tags.length > 0) {
    if (RequestContext.isActive()) {
      // Ideal path: use AsyncLocalStorage context
      RequestContext.addTags(result.tags);
    } else {
      // Fallback: use global store for cross-context propagation
      globalThis.__pantheonSurrogateKeyTags.push(...result.tags);
    }
  }

  return result;
};

// Export the handler instance with wrapped methods
export default {
  get: wrappedGet,
  set: handler.set.bind(handler),
  refreshTags: handler.refreshTags.bind(handler),
  getExpiration: handler.getExpiration.bind(handler),
  updateTags: handler.updateTags.bind(handler),
};
