import { test } from '../support/merged-fixtures';

test.describe('search saved', () => {
  test('search saved case 01', async ({ work }) => {
    await work(1000);
  });

  test('search saved case 02', async ({ work }) => {
    await work(400);
  });

  test('search saved case 03', async ({ work }) => {
    await work(300);
  });

  test('search saved case 04', async ({ work }) => {
    await work(400);
  });

  test('search saved case 05', async ({ work }) => {
    await work(300);
  });

  test('search saved case 06', async ({ work }) => {
    await work(1100);
  });

  test('search saved case 07', async ({ work }) => {
    await work(1100);
  });

  test('search saved case 08', async ({ work }) => {
    await work(300);
  });

  test('search saved case 09', async ({ work }) => {
    await work(700);
  });

  test('search saved case 10', async ({ work }) => {
    await work(200);
  });

  test('search saved case 11', async ({ work }) => {
    await work(600);
  });

  test('search saved case 12', async ({ work }) => {
    await work(300);
  });

  test('search saved case 13', async ({ work }) => {
    await work(800);
  });
});
