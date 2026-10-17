import { test } from '../support/merged-fixtures';

test.describe('catalog search', () => {
  test('catalog search case 01', async ({ work }) => {
    await work(300);
  });

  test('catalog search case 02', async ({ work }) => {
    await work(1000);
  });

  test('catalog search case 03', async ({ work }) => {
    await work(900);
  });

  test('catalog search case 04', async ({ work }) => {
    await work(500);
  });

  test('catalog search case 05', async ({ work }) => {
    await work(500);
  });

  test('catalog search case 06', async ({ work }) => {
    await work(800);
  });

  test('catalog search case 07', async ({ work }) => {
    await work(500);
  });

  test('catalog search case 08', async ({ work }) => {
    await work(800);
  });
});
