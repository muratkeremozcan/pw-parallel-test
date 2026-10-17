import { test } from '../support/merged-fixtures';

test.describe('cart coupons', () => {
  test('cart coupons case 01', async ({ work }) => {
    await work(1000);
  });

  test('cart coupons case 02', async ({ work }) => {
    await work(200);
  });

  test('cart coupons case 03', async ({ work }) => {
    await work(900);
  });

  test('cart coupons case 04', async ({ work }) => {
    await work(300);
  });

  test('cart coupons case 05', async ({ work }) => {
    await work(900);
  });

  test('cart coupons case 06', async ({ work }) => {
    await work(500);
  });

  test('cart coupons case 07', async ({ work }) => {
    await work(500);
  });

  test('cart coupons case 08', async ({ work }) => {
    await work(700);
  });
});
