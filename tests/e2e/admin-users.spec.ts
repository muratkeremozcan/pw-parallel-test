import { test } from '../support/merged-fixtures';

test.describe('admin users', () => {
  test('admin users case 01', async ({ work }) => {
    await work(1100);
  });

  test('admin users case 02', async ({ work }) => {
    await work(1000);
  });

  test('admin users case 03', async ({ work }) => {
    await work(700);
  });

  test('admin users case 04', async ({ work }) => {
    await work(200);
  });

  test('admin users case 05', async ({ work }) => {
    await work(1100);
  });

  test('admin users case 06', async ({ work }) => {
    await work(700);
  });

  test('admin users case 07', async ({ work }) => {
    await work(700);
  });

  test('admin users case 08', async ({ work }) => {
    await work(300);
  });

  test('admin users case 09', async ({ work }) => {
    await work(200);
  });

  test('admin users case 10', async ({ work }) => {
    await work(1000);
  });
});
