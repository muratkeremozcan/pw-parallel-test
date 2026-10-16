/**
 * Waits a fixed number of milliseconds. This is the whole body of every test in the suite: the
 * duration is the subject under measurement, so a timer is the correct primitive here and nothing
 * else waits on it.
 */
export const simulateWork = (ms: number): Promise<void> => {
  if (!Number.isInteger(ms) || ms < 0) {
    throw new Error(`simulateWork expects a non-negative integer of milliseconds, got ${ms}`);
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
};
