import { test } from '../support/merged-fixtures';

test.describe('teams members', () => {
  test('teams members case 01', async ({ work }) => {
    await work(600);
  });

  test('teams members case 02', async ({ work }) => {
    await work(200);
  });

  test('teams members case 03', async ({ work }) => {
    await work(300);
  });

  test('teams members case 04', async ({ work }) => {
    await work(900);
  });

  test('teams members case 05', async ({ work }) => {
    await work(1100);
  });

  test('teams members case 06', async ({ work }) => {
    await work(600);
  });

  test('teams members case 07', async ({ work }) => {
    await work(1100);
  });

  test('teams members case 08', async ({ work }) => {
    await work(200);
  });
});
