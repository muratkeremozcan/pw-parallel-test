import { test } from '../support/merged-fixtures';

test.describe('account settings', () => {
  test('account settings case 01', async ({ work }) => {
    await work(1300);
  });

  test('account settings case 02', async ({ work }) => {
    await work(500);
  });

  test('account settings case 03', async ({ work }) => {
    await work(1900);
  });

  test('account settings case 04', async ({ work }) => {
    await work(1000);
  });

  test('account settings case 05', async ({ work }) => {
    await work(200);
  });

  test('account settings case 06', async ({ work }) => {
    await work(800);
  });

  test('account settings case 07', async ({ work }) => {
    await work(1700);
  });
});
