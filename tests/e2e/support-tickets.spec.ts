import { test } from '../support/merged-fixtures';

test.describe('support tickets', () => {
  test('support tickets case 01', async ({ work }) => {
    await work(1000);
  });

  test('support tickets case 02', async ({ work }) => {
    await work(300);
  });

  test('support tickets case 03', async ({ work }) => {
    await work(300);
  });

  test('support tickets case 04', async ({ work }) => {
    await work(800);
  });

  test('support tickets case 05', async ({ work }) => {
    await work(900);
  });

  test('support tickets case 06', async ({ work }) => {
    await work(900);
  });

  test('support tickets case 07', async ({ work }) => {
    await work(700);
  });

  test('support tickets case 08', async ({ work }) => {
    await work(700);
  });

  test('support tickets case 09', async ({ work }) => {
    await work(700);
  });

  test('support tickets case 10', async ({ work }) => {
    await work(700);
  });

  test('support tickets case 11', async ({ work }) => {
    await work(900);
  });
});
