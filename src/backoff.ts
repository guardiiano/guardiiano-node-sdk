export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  backoffFactor: number,
  jitterMs: number,
): number {
  // Formula: delay = min(maxDelayMs, min(maxDelayMs, baseDelayMs * backoffFactor ** attempt) + jitter(0..jitterMs))
  const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * backoffFactor ** attempt);
  const jitter = Math.floor(Math.random() * jitterMs);
  return Math.min(maxDelayMs, exponentialDelay + jitter);
}
