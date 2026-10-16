import { test } from '../support/merged-fixtures';

test.describe('inbox messages', () => {
  test('inbox messages case 01', async ({ work }) => {
    await work(1400);
  });

  test('inbox messages case 02', async ({ work }) => {
    await work(1400);
  });

  test('inbox messages case 03', async ({ work }) => {
    await work(1100);
  });

  test('inbox messages case 04', async ({ work }) => {
    await work(600);
  });

  test('inbox messages case 05', async ({ work }) => {
    await work(900);
  });

  test('inbox messages case 06', async ({ work }) => {
    await work(1500);
  });
});
