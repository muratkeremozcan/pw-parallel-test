import { test } from '../support/merged-fixtures';

test.describe('search suggest', () => {
  test('search suggest case 01', async ({ work }) => {
    await work(600);
  });

  test('search suggest case 02', async ({ work }) => {
    await work(300);
  });

  test('search suggest case 03', async ({ work }) => {
    await work(300);
  });

  test('search suggest case 04', async ({ work }) => {
    await work(500);
  });

  test('search suggest case 05', async ({ work }) => {
    await work(400);
  });

  test('search suggest case 06', async ({ work }) => {
    await work(400);
  });

  test('search suggest case 07', async ({ work }) => {
    await work(200);
  });

  test('search suggest case 08', async ({ work }) => {
    await work(300);
  });

  test('search suggest case 09', async ({ work }) => {
    await work(1000);
  });

  test('search suggest case 10', async ({ work }) => {
    await work(200);
  });

  test('search suggest case 11', async ({ work }) => {
    await work(400);
  });
});
