import { test } from '../support/merged-fixtures';

test.describe('checkout payments', () => {
  test('checkout payments case 01', async ({ work }) => {
    await work(8400);
  });

  test('checkout payments case 02', async ({ work }) => {
    await work(11600);
  });

  test('checkout payments case 03', async ({ work }) => {
    await work(7300);
  });

  test('checkout payments case 04', async ({ work }) => {
    await work(6500);
  });

  test('checkout payments case 05', async ({ work }) => {
    await work(8900);
  });

  test('checkout payments case 06', async ({ work }) => {
    await work(12300);
  });
});
