import { test } from '../support/merged-fixtures';

test.describe('reports sharing', () => {
  test('reports sharing case 01', async ({ work }) => {
    await work(5700);
  });

  test('reports sharing case 02', async ({ work }) => {
    await work(6000);
  });
});
