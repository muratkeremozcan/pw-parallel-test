import { test } from '../support/merged-fixtures';

test.describe('wishlist share', () => {
  test('wishlist share case 01', async ({ work }) => {
    await work(900);
  });

  test('wishlist share case 02', async ({ work }) => {
    await work(500);
  });

  test('wishlist share case 03', async ({ work }) => {
    await work(1000);
  });

  test('wishlist share case 04', async ({ work }) => {
    await work(1900);
  });

  test('wishlist share case 05', async ({ work }) => {
    await work(1900);
  });

  test('wishlist share case 06', async ({ work }) => {
    await work(1200);
  });

  test('wishlist share case 07', async ({ work }) => {
    await work(1000);
  });

  test('wishlist share case 08', async ({ work }) => {
    await work(900);
  });

  test('wishlist share case 09', async ({ work }) => {
    await work(1400);
  });
});
