import { test as base } from '@playwright/test';
import { simulateWork } from '../helpers/simulate-work';

type WorkFixture = {
  /** Spends the given fixed duration in milliseconds. */
  work: (ms: number) => Promise<void>;
};

export const test = base.extend<WorkFixture>({
  // eslint-disable-next-line no-empty-pattern
  work: async ({}, use) => {
    await use(simulateWork);
  },
});
