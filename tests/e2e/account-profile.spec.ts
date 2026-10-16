import { test } from '../support/merged-fixtures';

test.describe('account profile', () => {
  test('account profile case 01', async ({ work }) => {
    await work(1300);
  });

  test('account profile case 02', async ({ work }) => {
    await work(200);
  });

  test('account profile case 03', async ({ work }) => {
    await work(1100);
  });

  test('account profile case 04', async ({ work }) => {
    await work(1300);
  });

  test('account profile case 05', async ({ work }) => {
    await work(200);
  });
});
