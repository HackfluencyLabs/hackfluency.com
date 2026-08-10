/**
 * Races a promise against a timeout. If `ms` elapses before the promise
 * settles, the returned promise rejects with a TimeoutError.
 *
 * Used to keep the UI responsive when Supabase is paused or unreachable —
 * instead of hanging on loading skeletons forever, we fall back to a sane
 * default state and let the user retry.
 */
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}