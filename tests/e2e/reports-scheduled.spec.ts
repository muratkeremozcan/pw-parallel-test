import { test } from '../support/merged-fixtures';

test.describe('reports scheduled', () => {
  test('reports scheduled case 01', async ({ work }) => {
    await work(5800);
  });

  test('reports scheduled case 02', async ({ work }) => {
    await work(8900);
  });

  test('reports scheduled case 03', async ({ work }) => {
    await work(9300);
  });
});
