import { test } from '../support/merged-fixtures';

test.describe('admin roles', () => {
  test('admin roles case 01', async ({ work }) => {
    await work(600);
  });

  test('admin roles case 02', async ({ work }) => {
    await work(900);
  });

  test('admin roles case 03', async ({ work }) => {
    await work(600);
  });

  test('admin roles case 04', async ({ work }) => {
    await work(300);
  });

  test('admin roles case 05', async ({ work }) => {
    await work(1700);
  });

  test('admin roles case 06', async ({ work }) => {
    await work(1900);
  });
});
