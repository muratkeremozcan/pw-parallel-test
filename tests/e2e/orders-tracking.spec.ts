import { test } from '../support/merged-fixtures';

test.describe('orders tracking', () => {
  test('orders tracking case 01', async ({ work }) => {
    await work(1100);
  });

  test('orders tracking case 02', async ({ work }) => {
    await work(500);
  });

  test('orders tracking case 03', async ({ work }) => {
    await work(200);
  });

  test('orders tracking case 04', async ({ work }) => {
    await work(1100);
  });

  test('orders tracking case 05', async ({ work }) => {
    await work(900);
  });

  test('orders tracking case 06', async ({ work }) => {
    await work(500);
  });

  test('orders tracking case 07', async ({ work }) => {
    await work(1100);
  });

  test('orders tracking case 08', async ({ work }) => {
    await work(1000);
  });

  test('orders tracking case 09', async ({ work }) => {
    await work(700);
  });

  test('orders tracking case 10', async ({ work }) => {
    await work(600);
  });

  test('orders tracking case 11', async ({ work }) => {
    await work(700);
  });

  test('orders tracking case 12', async ({ work }) => {
    await work(300);
  });

  test('orders tracking case 13', async ({ work }) => {
    await work(300);
  });
});
