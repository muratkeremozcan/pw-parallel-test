import { test } from '../support/merged-fixtures';

test.describe('settings security', () => {
  test('settings security case 01', async ({ work }) => {
    await work(1000);
  });

  test('settings security case 02', async ({ work }) => {
    await work(900);
  });

  test('settings security case 03', async ({ work }) => {
    await work(900);
  });

  test('settings security case 04', async ({ work }) => {
    await work(1000);
  });

  test('settings security case 05', async ({ work }) => {
    await work(700);
  });

  test('settings security case 06', async ({ work }) => {
    await work(600);
  });

  test('settings security case 07', async ({ work }) => {
    await work(700);
  });

  test('settings security case 08', async ({ work }) => {
    await work(900);
  });
});
