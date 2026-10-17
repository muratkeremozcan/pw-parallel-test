import { test } from '../support/merged-fixtures';

test.describe('cart totals', () => {
  test('cart totals case 01', async ({ work }) => {
    await work(1000);
  });

  test('cart totals case 02', async ({ work }) => {
    await work(700);
  });

  test('cart totals case 03', async ({ work }) => {
    await work(700);
  });

  test('cart totals case 04', async ({ work }) => {
    await work(1000);
  });

  test('cart totals case 05', async ({ work }) => {
    await work(1000);
  });

  test('cart totals case 06', async ({ work }) => {
    await work(1000);
  });

  test('cart totals case 07', async ({ work }) => {
    await work(1000);
  });

  test('cart totals case 08', async ({ work }) => {
    await work(200);
  });
});
