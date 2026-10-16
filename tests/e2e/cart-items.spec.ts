import { test } from '../support/merged-fixtures';

test.describe('cart items', () => {
  test('cart items case 01', async ({ work }) => {
    await work(1100);
  });

  test('cart items case 02', async ({ work }) => {
    await work(1900);
  });

  test('cart items case 03', async ({ work }) => {
    await work(1700);
  });

  test('cart items case 04', async ({ work }) => {
    await work(1900);
  });

  test('cart items case 05', async ({ work }) => {
    await work(1200);
  });

  test('cart items case 06', async ({ work }) => {
    await work(1300);
  });
});
