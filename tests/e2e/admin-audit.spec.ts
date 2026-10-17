import { test } from '../support/merged-fixtures';

test.describe('admin audit', () => {
  test('admin audit case 01', async ({ work }) => {
    await work(500);
  });

  test('admin audit case 02', async ({ work }) => {
    await work(700);
  });

  test('admin audit case 03', async ({ work }) => {
    await work(1100);
  });

  test('admin audit case 04', async ({ work }) => {
    await work(600);
  });

  test('admin audit case 05', async ({ work }) => {
    await work(500);
  });

  test('admin audit case 06', async ({ work }) => {
    await work(500);
  });

  test('admin audit case 07', async ({ work }) => {
    await work(800);
  });

  test('admin audit case 08', async ({ work }) => {
    await work(600);
  });

  test('admin audit case 09', async ({ work }) => {
    await work(200);
  });
});
