import { test } from '../support/merged-fixtures';

test.describe('settings billing', () => {
  test('settings billing case 01', async ({ work }) => {
    await work(1300);
  });

  test('settings billing case 02', async ({ work }) => {
    await work(2000);
  });

  test('settings billing case 03', async ({ work }) => {
    await work(1000);
  });

  test('settings billing case 04', async ({ work }) => {
    await work(1600);
  });

  test('settings billing case 05', async ({ work }) => {
    await work(1400);
  });

  test('settings billing case 06', async ({ work }) => {
    await work(1000);
  });

  test('settings billing case 07', async ({ work }) => {
    await work(900);
  });

  test('settings billing case 08', async ({ work }) => {
    await work(900);
  });
});
