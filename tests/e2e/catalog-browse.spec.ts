import { test } from '../support/merged-fixtures';

test.describe('catalog browse', () => {
  test('catalog browse case 01', async ({ work }) => {
    await work(600);
  });

  test('catalog browse case 02', async ({ work }) => {
    await work(200);
  });

  test('catalog browse case 03', async ({ work }) => {
    await work(600);
  });

  test('catalog browse case 04', async ({ work }) => {
    await work(800);
  });

  test('catalog browse case 05', async ({ work }) => {
    await work(800);
  });

  test('catalog browse case 06', async ({ work }) => {
    await work(1000);
  });

  test('catalog browse case 07', async ({ work }) => {
    await work(800);
  });

  test('catalog browse case 08', async ({ work }) => {
    await work(800);
  });

  test('catalog browse case 09', async ({ work }) => {
    await work(200);
  });

  test('catalog browse case 10', async ({ work }) => {
    await work(1000);
  });
});
