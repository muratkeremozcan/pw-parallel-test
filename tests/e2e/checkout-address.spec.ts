import { test } from '../support/merged-fixtures';

test.describe('checkout address', () => {
  test('checkout address case 01', async ({ work }) => {
    await work(5400);
  });

  test('checkout address case 02', async ({ work }) => {
    await work(5300);
  });
});
