/**
 * Sliding Window Rate Limiter Middleware
 * Protects server functions against brute-force attacks, spam, and DoS.
 */

interface RateLimitRecord {
  timestamps: number[];
}

class SlidingWindowRateLimiter {
  private store = new Map<string, RateLimitRecord>();

  /**
   * Checks if a request from key is allowed within windowMs up to maxLimit requests.
   * Cleans up expired timestamps automatically.
   */
  public isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Remove timestamps older than current window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= limit) {
      return false;
    }

    record.timestamps.push(now);
    return true;
  }

  /**
   * Resets rate limit for a specific key (useful after successful verification or testing).
   */
  public reset(key: string): void {
    this.store.delete(key);
  }
}

export const globalRateLimiter = new SlidingWindowRateLimiter();

/**
 * Asserts rate limit policy for a given key. Throws an error if limit exceeded.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number, errorMessage?: string): void {
  const allowed = globalRateLimiter.isAllowed(key, limit, windowMs);
  if (!allowed) {
    throw new Error(
      errorMessage || "Too many requests. Please slow down and try again shortly."
    );
  }
}
