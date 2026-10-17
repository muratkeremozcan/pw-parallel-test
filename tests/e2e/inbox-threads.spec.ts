import { test } from '../support/merged-fixtures';

test.describe('inbox threads', () => {
  test('inbox threads case 01', async ({ work }) => {
    await work(800);
  });

  test('inbox threads case 02', async ({ work }) => {
    await work(1100);
  });

  test('inbox threads case 03', async ({ work }) => {
    await work(200);
  });

  test('inbox threads case 04', async ({ work }) => {
    await work(300);
  });

  test('inbox threads case 05', async ({ work }) => {
    await work(800);
  });

  test('inbox threads case 06', async ({ work }) => {
    await work(200);
  });

  test('inbox threads case 07', async ({ work }) => {
    await work(1100);
  });

  test('inbox threads case 08', async ({ work }) => {
    await work(400);
  });
});
