import { test } from '../support/merged-fixtures';

test.describe('cart badges', () => {
  test('cart badges case 01', async ({ work }) => {
    await work(600);
  });

  test('cart badges case 02', async ({ work }) => {
    await work(400);
  });

  test('cart badges case 03', async ({ work }) => {
    await work(900);
  });

  test('cart badges case 04', async ({ work }) => {
    await work(400);
  });

  test('cart badges case 05', async ({ work }) => {
    await work(200);
  });

  test('cart badges case 06', async ({ work }) => {
    await work(300);
  });

  test('cart badges case 07', async ({ work }) => {
    await work(500);
  });

  test('cart badges case 08', async ({ work }) => {
    await work(200);
  });

  test('cart badges case 09', async ({ work }) => {
    await work(1000);
  });
});
