import type { BurnInConfig } from '@seontechnologies/playwright-utils/burn-in';

const config: BurnInConfig = {
  // Changes here never change what a test does, so they trigger no burn-in.
  skipBurnInPatterns: [
    '**/*.md',
    '**/README*',
    '.github/**',
    'scripts/**',
    'results/**',
    '_bmad/**',
    '.tea/**',
    '.claude/**',
  ],
  testPatterns: ['tests/**/*.spec.ts', 'tests/**/*.setup.ts'],
  burnInTestPercentage: 0.5,
  // Retries stay 0: a retry would hide exactly the instability burn-in exists to find.
  burnIn: { repeatEach: 3, retries: 0 },
};

export default config;
