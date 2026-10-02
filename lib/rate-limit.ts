interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((t) => now - t < 3600000);
      if (record.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  windowMs: number; // Duration of the rate limit window in milliseconds
  max: number;      // Maximum requests allowed in the window
}

/**
 * Checks whether an identifier (e.g. IP address or user ID) has exceeded rate limits.
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60 * 1000, max: 10 }
): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = memoryStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(identifier, record);
  }

  // Filter timestamps within the current sliding window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= options.max) {
    const oldest = record.timestamps[0];
    const resetTime = oldest + options.windowMs;
    return {
      success: false,
      limit: options.max,
      remaining: 0,
      reset: Math.ceil((resetTime - now) / 1000),
    };
  }

  record.timestamps.push(now);

  return {
    success: true,
    limit: options.max,
    remaining: options.max - record.timestamps.length,
    reset: Math.ceil(options.windowMs / 1000),
  };
}
