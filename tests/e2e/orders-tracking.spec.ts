import { test } from '../support/merged-fixtures';

test.describe('orders tracking', () => {
  test('orders tracking case 01', async ({ work }) => {
    await work(700);
  });

  test('orders tracking case 02', async ({ work }) => {
    await work(1300);
  });

  test('orders tracking case 03', async ({ work }) => {
    await work(1400);
  });

  test('orders tracking case 04', async ({ work }) => {
    await work(1300);
  });

  test('orders tracking case 05', async ({ work }) => {
    await work(700);
  });

  test('orders tracking case 06', async ({ work }) => {
    await work(500);
  });

  test('orders tracking case 07', async ({ work }) => {
    await work(500);
  });
});
