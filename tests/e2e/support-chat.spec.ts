import { test } from '../support/merged-fixtures';

test.describe('support chat', () => {
  test('support chat case 01', async ({ work }) => {
    await work(800);
  });

  test('support chat case 02', async ({ work }) => {
    await work(900);
  });

  test('support chat case 03', async ({ work }) => {
    await work(600);
  });

  test('support chat case 04', async ({ work }) => {
    await work(500);
  });

  test('support chat case 05', async ({ work }) => {
    await work(400);
  });

  test('support chat case 06', async ({ work }) => {
    await work(900);
  });

  test('support chat case 07', async ({ work }) => {
    await work(600);
  });

  test('support chat case 08', async ({ work }) => {
    await work(400);
  });

  test('support chat case 09', async ({ work }) => {
    await work(400);
  });

  test('support chat case 10', async ({ work }) => {
    await work(600);
  });
});
