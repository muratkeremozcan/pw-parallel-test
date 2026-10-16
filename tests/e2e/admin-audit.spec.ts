import { test } from '../support/merged-fixtures';

test.describe('admin audit', () => {
  test('admin audit case 01', async ({ work }) => {
    await work(1300);
  });

  test('admin audit case 02', async ({ work }) => {
    await work(1200);
  });

  test('admin audit case 03', async ({ work }) => {
    await work(1700);
  });

  test('admin audit case 04', async ({ work }) => {
    await work(300);
  });

  test('admin audit case 05', async ({ work }) => {
    await work(800);
  });

  test('admin audit case 06', async ({ work }) => {
    await work(1600);
  });

  test('admin audit case 07', async ({ work }) => {
    await work(1000);
  });

  test('admin audit case 08', async ({ work }) => {
    await work(400);
  });

  test('admin audit case 09', async ({ work }) => {
    await work(300);
  });

  test('admin audit case 10', async ({ work }) => {
    await work(300);
  });
});
