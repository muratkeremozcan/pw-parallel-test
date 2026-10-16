import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);

/**
 * Synthetic measurement suite. Every test body waits a fixed, committed duration and touches no
 * browser, so shard balance is the only variable between runs.
 *
 * - fullyParallel is left at Playwright's default (false): a spec file is the unit native sharding
 *   distributes, and the serial describe in serial-ledger.spec.ts stays whole either way.
 * - retries are 0 so a run's duration is never inflated by a rerun.
 * - workers are 1 per shard so a shard's run time is the sum of its tests.
 */
export default defineConfig({
  testDir: './tests',
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
