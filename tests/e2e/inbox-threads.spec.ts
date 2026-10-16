import { test } from '../support/merged-fixtures';

test.describe('inbox threads', () => {
  test('inbox threads case 01', async ({ work }) => {
    await work(1300);
  });

  test('inbox threads case 02', async ({ work }) => {
    await work(1700);
  });

  test('inbox threads case 03', async ({ work }) => {
    await work(400);
  });

  test('inbox threads case 04', async ({ work }) => {
    await work(1200);
  });

  test('inbox threads case 05', async ({ work }) => {
    await work(1100);
  });

  test('inbox threads case 06', async ({ work }) => {
    await work(1000);
  });
});
