import { test } from '../support/merged-fixtures';

test.describe('checkout payments', () => {
  test('checkout payments case 01', async ({ work }) => {
    await work(5900);
  });

  test('checkout payments case 02', async ({ work }) => {
    await work(5600);
  });
});
