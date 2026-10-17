import { test } from '../support/merged-fixtures';

test.describe('reports templates', () => {
  test('reports templates case 01', async ({ work }) => {
    await work(5800);
  });

  test('reports templates case 02', async ({ work }) => {
    await work(4700);
  });
});
