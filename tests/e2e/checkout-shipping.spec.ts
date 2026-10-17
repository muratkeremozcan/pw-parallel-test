import { test } from '../support/merged-fixtures';

test.describe('checkout shipping', () => {
  test('checkout shipping case 01', async ({ work }) => {
    await work(4600);
  });

  test('checkout shipping case 02', async ({ work }) => {
    await work(4900);
  });
});
