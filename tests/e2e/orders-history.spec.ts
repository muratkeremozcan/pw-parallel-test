import { test } from '../support/merged-fixtures';

test.describe('orders history', () => {
  test('orders history case 01', async ({ work }) => {
    await work(1500);
  });

  test('orders history case 02', async ({ work }) => {
    await work(300);
  });

  test('orders history case 03', async ({ work }) => {
    await work(700);
  });

  test('orders history case 04', async ({ work }) => {
    await work(1700);
  });

  test('orders history case 05', async ({ work }) => {
    await work(200);
  });

  test('orders history case 06', async ({ work }) => {
    await work(500);
  });
});
