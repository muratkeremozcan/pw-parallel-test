import { test } from '../support/merged-fixtures';

test.describe('orders returns', () => {
  test('orders returns case 01', async ({ work }) => {
    await work(400);
  });

  test('orders returns case 02', async ({ work }) => {
    await work(600);
  });

  test('orders returns case 03', async ({ work }) => {
    await work(400);
  });

  test('orders returns case 04', async ({ work }) => {
    await work(1100);
  });

  test('orders returns case 05', async ({ work }) => {
    await work(1100);
  });

  test('orders returns case 06', async ({ work }) => {
    await work(800);
  });

  test('orders returns case 07', async ({ work }) => {
    await work(800);
  });

  test('orders returns case 08', async ({ work }) => {
    await work(600);
  });

  test('orders returns case 09', async ({ work }) => {
    await work(700);
  });

  test('orders returns case 10', async ({ work }) => {
    await work(1000);
  });

  test('orders returns case 11', async ({ work }) => {
    await work(500);
  });

  test('orders returns case 12', async ({ work }) => {
    await work(400);
  });

  test('orders returns case 13', async ({ work }) => {
    await work(600);
  });

  test('orders returns case 14', async ({ work }) => {
    await work(200);
  });
});
