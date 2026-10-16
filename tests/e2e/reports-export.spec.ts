import { test } from '../support/merged-fixtures';

test.describe('reports export', () => {
  test('reports export case 01', async ({ work }) => {
    await work(11000);
  });

  test('reports export case 02', async ({ work }) => {
    await work(6300);
  });

  test('reports export case 03', async ({ work }) => {
    await work(8600);
  });

  test('reports export case 04', async ({ work }) => {
    await work(6700);
  });

  test('reports export case 05', async ({ work }) => {
    await work(8500);
  });

  test('reports export case 06', async ({ work }) => {
    await work(6900);
  });
});
