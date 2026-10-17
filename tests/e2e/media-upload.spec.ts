import { test } from '../support/merged-fixtures';

test.describe('media upload', () => {
  test('media upload case 01', async ({ work }) => {
    await work(4700);
  });

  test('media upload case 02', async ({ work }) => {
    await work(5900);
  });
});
