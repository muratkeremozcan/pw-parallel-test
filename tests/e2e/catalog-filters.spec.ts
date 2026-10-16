import { test } from '../support/merged-fixtures';

test.describe('catalog filters', () => {
  test('catalog filters case 01', async ({ work }) => {
    await work(1400);
  });

  test('catalog filters case 02', async ({ work }) => {
    await work(400);
  });

  test('catalog filters case 03', async ({ work }) => {
    await work(400);
  });

  test('catalog filters case 04', async ({ work }) => {
    await work(400);
  });

  test('catalog filters case 05', async ({ work }) => {
    await work(1300);
  });
});
