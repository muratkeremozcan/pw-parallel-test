import { test } from '../support/merged-fixtures';

test.describe('checkout shipping', () => {
  test('checkout shipping case 01', async ({ work }) => {
    await work(9500);
  });

  test('checkout shipping case 02', async ({ work }) => {
    await work(5800);
  });

  test('checkout shipping case 03', async ({ work }) => {
    await work(6000);
  });

  test('checkout shipping case 04', async ({ work }) => {
    await work(8700);
  });
});
