import { test } from '../support/merged-fixtures';

test.describe('settings billing', () => {
  test('settings billing case 01', async ({ work }) => {
    await work(900);
  });

  test('settings billing case 02', async ({ work }) => {
    await work(900);
  });

  test('settings billing case 03', async ({ work }) => {
    await work(200);
  });

  test('settings billing case 04', async ({ work }) => {
    await work(300);
  });

  test('settings billing case 05', async ({ work }) => {
    await work(200);
  });

  test('settings billing case 06', async ({ work }) => {
    await work(1100);
  });

  test('settings billing case 07', async ({ work }) => {
    await work(900);
  });

  test('settings billing case 08', async ({ work }) => {
    await work(500);
  });

  test('settings billing case 09', async ({ work }) => {
    await work(1100);
  });

  test('settings billing case 10', async ({ work }) => {
    await work(1000);
  });

  test('settings billing case 11', async ({ work }) => {
    await work(700);
  });

  test('settings billing case 12', async ({ work }) => {
    await work(500);
  });

  test('settings billing case 13', async ({ work }) => {
    await work(1100);
  });
});
