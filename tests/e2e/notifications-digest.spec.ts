import { test } from '../support/merged-fixtures';

test.describe('notifications digest', () => {
  test('notifications digest case 01', async ({ work }) => {
    await work(1000);
  });

  test('notifications digest case 02', async ({ work }) => {
    await work(200);
  });

  test('notifications digest case 03', async ({ work }) => {
    await work(1100);
  });

  test('notifications digest case 04', async ({ work }) => {
    await work(500);
  });

  test('notifications digest case 05', async ({ work }) => {
    await work(800);
  });

  test('notifications digest case 06', async ({ work }) => {
    await work(800);
  });

  test('notifications digest case 07', async ({ work }) => {
    await work(500);
  });

  test('notifications digest case 08', async ({ work }) => {
    await work(500);
  });

  test('notifications digest case 09', async ({ work }) => {
    await work(600);
  });

  test('notifications digest case 10', async ({ work }) => {
    await work(300);
  });

  test('notifications digest case 11', async ({ work }) => {
    await work(1100);
  });

  test('notifications digest case 12', async ({ work }) => {
    await work(1000);
  });

  test('notifications digest case 13', async ({ work }) => {
    await work(200);
  });
});
