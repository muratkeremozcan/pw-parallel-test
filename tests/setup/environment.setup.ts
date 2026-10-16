import { test as setup } from '../support/merged-fixtures';

// Stands in for one-time environment preparation that the chromium project depends on.
setup('prepare environment', async ({ work }) => {
  await work(3000);
});
