import { test } from '../support/merged-fixtures';

test.describe('checkout taxes', () => {
  test('checkout taxes case 01', async ({ work }) => {
    await work(5000);
  });

  test('checkout taxes case 02', async ({ work }) => {
    await work(6000);
  });
});
