import { test } from '../support/merged-fixtures';

test.describe('reports export', () => {
  test('reports export case 01', async ({ work }) => {
    await work(5200);
  });

  test('reports export case 02', async ({ work }) => {
    await work(5000);
  });
});
