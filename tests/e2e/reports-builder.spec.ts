import { test } from '../support/merged-fixtures';

test.describe('reports builder', () => {
  test('reports builder case 01', async ({ work }) => {
    await work(5800);
  });

  test('reports builder case 02', async ({ work }) => {
    await work(5800);
  });
});
