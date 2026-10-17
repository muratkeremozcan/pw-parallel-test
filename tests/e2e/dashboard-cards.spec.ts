import { test } from '../support/merged-fixtures';

test.describe('dashboard cards', () => {
  test('dashboard cards case 01', async ({ work }) => {
    await work(900);
  });

  test('dashboard cards case 02', async ({ work }) => {
    await work(300);
  });

  test('dashboard cards case 03', async ({ work }) => {
    await work(800);
  });

  test('dashboard cards case 04', async ({ work }) => {
    await work(1000);
  });

  test('dashboard cards case 05', async ({ work }) => {
    await work(600);
  });

  test('dashboard cards case 06', async ({ work }) => {
    await work(1000);
  });

  test('dashboard cards case 07', async ({ work }) => {
    await work(300);
  });

  test('dashboard cards case 08', async ({ work }) => {
    await work(800);
  });

  test('dashboard cards case 09', async ({ work }) => {
    await work(300);
  });

  test('dashboard cards case 10', async ({ work }) => {
    await work(1100);
  });
});
