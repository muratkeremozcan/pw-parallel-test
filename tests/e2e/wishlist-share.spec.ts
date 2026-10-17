import { test } from '../support/merged-fixtures';

test.describe('wishlist share', () => {
  test('wishlist share case 01', async ({ work }) => {
    await work(400);
  });

  test('wishlist share case 02', async ({ work }) => {
    await work(1000);
  });

  test('wishlist share case 03', async ({ work }) => {
    await work(400);
  });

  test('wishlist share case 04', async ({ work }) => {
    await work(1000);
  });

  test('wishlist share case 05', async ({ work }) => {
    await work(1100);
  });

  test('wishlist share case 06', async ({ work }) => {
    await work(400);
  });

  test('wishlist share case 07', async ({ work }) => {
    await work(400);
  });

  test('wishlist share case 08', async ({ work }) => {
    await work(800);
  });

  test('wishlist share case 09', async ({ work }) => {
    await work(1100);
  });

  test('wishlist share case 10', async ({ work }) => {
    await work(200);
  });

  test('wishlist share case 11', async ({ work }) => {
    await work(200);
  });

  test('wishlist share case 12', async ({ work }) => {
    await work(800);
  });

  test('wishlist share case 13', async ({ work }) => {
    await work(200);
  });
});
