import { test } from '../support/merged-fixtures';

test.describe('cart coupons', () => {
  test('cart coupons case 01', async ({ work }) => {
    await work(1100);
  });

  test('cart coupons case 02', async ({ work }) => {
    await work(1900);
  });

  test('cart coupons case 03', async ({ work }) => {
    await work(1200);
  });

  test('cart coupons case 04', async ({ work }) => {
    await work(1200);
  });

  test('cart coupons case 05', async ({ work }) => {
    await work(1600);
  });
});
