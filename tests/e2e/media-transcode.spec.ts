import { test } from '../support/merged-fixtures';

test.describe('media transcode', () => {
  test('media transcode case 01', async ({ work }) => {
    await work(5100);
  });

  test('media transcode case 02', async ({ work }) => {
    await work(4900);
  });
});
