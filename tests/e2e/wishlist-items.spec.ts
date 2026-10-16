import { test } from '../support/merged-fixtures';

test.describe('wishlist items', () => {
  test('wishlist items case 01', async ({ work }) => {
    await work(1700);
  });

  test('wishlist items case 02', async ({ work }) => {
    await work(400);
  });

  test('wishlist items case 03', async ({ work }) => {
    await work(1300);
  });

  test('wishlist items case 04', async ({ work }) => {
    await work(1600);
  });

  test('wishlist items case 05', async ({ work }) => {
    await work(2000);
  });

  test('wishlist items case 06', async ({ work }) => {
    await work(1300);
  });

  test('wishlist items case 07', async ({ work }) => {
    await work(1100);
  });
});
