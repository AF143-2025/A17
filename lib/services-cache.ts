/**
 * In-memory cache for the services hierarchy to prevent heavy database queries
 * on every page load and ensure instant responses (<1ms).
 */

let cachedData: any = null;
let lastCachedAt = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export function getCachedServicesHierarchy() {
  if (cachedData && Date.now() - lastCachedAt < CACHE_TTL_MS) {
    return cachedData;
  }
  return null;
}

export function setCachedServicesHierarchy(data: any) {
  cachedData = data;
  lastCachedAt = Date.now();
}

export function invalidateServicesCache() {
  cachedData = null;
  lastCachedAt = 0;
}
