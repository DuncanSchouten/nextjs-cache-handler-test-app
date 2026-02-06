// Cache handler configuration using @pantheon-systems/nextjs-cache-handler
import { createCacheHandler } from '@pantheon-systems/nextjs-cache-handler';

// During build (NODE_ENV !== 'production'), use file-based caching to avoid GCS rate limits
// At runtime in production, use auto-detection (GCS if CACHE_BUCKET is set)
const isRuntime = process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE;

const CacheHandler = createCacheHandler({
  type: isRuntime ? 'auto' : 'file',
});

export default CacheHandler;
