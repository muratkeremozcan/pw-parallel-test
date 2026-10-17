import { test } from '../support/merged-fixtures';

test.describe('billing plans', () => {
  test('billing plans case 01', async ({ work }) => {
    await work(200);
  });

  test('billing plans case 02', async ({ work }) => {
    await work(700);
  });

  test('billing plans case 03', async ({ work }) => {
    await work(600);
  });

  test('billing plans case 04', async ({ work }) => {
    await work(1100);
  });

  test('billing plans case 05', async ({ work }) => {
    await work(200);
  });

  test('billing plans case 06', async ({ work }) => {
    await work(1100);
  });

  test('billing plans case 07', async ({ work }) => {
    await work(1100);
  });

  test('billing plans case 08', async ({ work }) => {
    await work(800);
  });
});
