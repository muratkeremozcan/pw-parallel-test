import { test } from '../support/merged-fixtures';

test.describe('wishlist items', () => {
  test('wishlist items case 01', async ({ work }) => {
    await work(700);
  });

  test('wishlist items case 02', async ({ work }) => {
    await work(700);
  });

  test('wishlist items case 03', async ({ work }) => {
    await work(1000);
  });

  test('wishlist items case 04', async ({ work }) => {
    await work(600);
  });

  test('wishlist items case 05', async ({ work }) => {
    await work(400);
  });

  test('wishlist items case 06', async ({ work }) => {
    await work(700);
  });

  test('wishlist items case 07', async ({ work }) => {
    await work(200);
  });

  test('wishlist items case 08', async ({ work }) => {
    await work(800);
  });
});
