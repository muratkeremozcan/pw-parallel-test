import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
// The measurement workflows set PW_FULLY_PARALLEL from their fully-parallel input.
const fullyParallel = process.env.PW_FULLY_PARALLEL === 'true';

/**
 * Synthetic measurement suite. Every test body waits a fixed, committed duration and touches no
 * browser, so shard balance is the only variable between runs.
 *
 * - fullyParallel is Playwright's default (false) unless PW_FULLY_PARALLEL is true. Off, a spec file
 *   is the unit native sharding distributes; on, a test is, and the serial describe in
 *   serial-ledger.spec.ts stays whole either way. The value is kept in the config metadata, which
 *   the blob report carries, so a measured run records which way it ran.
 * - retries are 0 so a run's duration is never inflated by a rerun.
 * - workers default to 1; the measurement workflows pass --workers per shard.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel,
  metadata: { fullyParallel },
  forbidOnly: isCI,
  retries: 0,
  // Burn-in (PW_BURN_IN, set by playwright-utils) repeats tests and is no measurement, so it fans out.
  workers: process.env.PW_BURN_IN === 'true' ? 4 : 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI
    ? [['blob'], ['list']]
    : [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]],
  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure-and-retries',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testDir: './tests/setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
