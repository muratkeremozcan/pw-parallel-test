import { test } from '../support/merged-fixtures';

test.describe('cart items', () => {
  test('cart items case 01', async ({ work }) => {
    await work(800);
  });

  test('cart items case 02', async ({ work }) => {
    await work(900);
  });

  test('cart items case 03', async ({ work }) => {
    await work(800);
  });

  test('cart items case 04', async ({ work }) => {
    await work(600);
  });

  test('cart items case 05', async ({ work }) => {
    await work(500);
  });

  test('cart items case 06', async ({ work }) => {
    await work(800);
  });

  test('cart items case 07', async ({ work }) => {
    await work(900);
  });

  test('cart items case 08', async ({ work }) => {
    await work(1100);
  });

  test('cart items case 09', async ({ work }) => {
    await work(500);
  });

  test('cart items case 10', async ({ work }) => {
    await work(200);
  });
});
