import { test } from '../support/merged-fixtures';

test.describe('orders history', () => {
  test('orders history case 01', async ({ work }) => {
    await work(1000);
  });

  test('orders history case 02', async ({ work }) => {
    await work(800);
  });

  test('orders history case 03', async ({ work }) => {
    await work(200);
  });

  test('orders history case 04', async ({ work }) => {
    await work(500);
  });

  test('orders history case 05', async ({ work }) => {
    await work(500);
  });

  test('orders history case 06', async ({ work }) => {
    await work(1100);
  });

  test('orders history case 07', async ({ work }) => {
    await work(1100);
  });

  test('orders history case 08', async ({ work }) => {
    await work(1100);
  });

  test('orders history case 09', async ({ work }) => {
    await work(800);
  });

  test('orders history case 10', async ({ work }) => {
    await work(500);
  });

  test('orders history case 11', async ({ work }) => {
    await work(400);
  });

  test('orders history case 12', async ({ work }) => {
    await work(500);
  });

  test('orders history case 13', async ({ work }) => {
    await work(300);
  });

  test('orders history case 14', async ({ work }) => {
    await work(700);
  });
});
