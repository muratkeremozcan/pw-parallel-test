import { test } from '../support/merged-fixtures';

test.describe('checkout review', () => {
  test('checkout review case 01', async ({ work }) => {
    await work(5300);
  });

  test('checkout review case 02', async ({ work }) => {
    await work(4800);
  });
});
