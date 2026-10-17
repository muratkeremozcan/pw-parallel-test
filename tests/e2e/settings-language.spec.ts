import { test } from '../support/merged-fixtures';

test.describe('settings language', () => {
  test('settings language case 01', async ({ work }) => {
    await work(500);
  });

  test('settings language case 02', async ({ work }) => {
    await work(1100);
  });

  test('settings language case 03', async ({ work }) => {
    await work(500);
  });

  test('settings language case 04', async ({ work }) => {
    await work(800);
  });

  test('settings language case 05', async ({ work }) => {
    await work(200);
  });

  test('settings language case 06', async ({ work }) => {
    await work(400);
  });

  test('settings language case 07', async ({ work }) => {
    await work(1000);
  });

  test('settings language case 08', async ({ work }) => {
    await work(600);
  });
});
