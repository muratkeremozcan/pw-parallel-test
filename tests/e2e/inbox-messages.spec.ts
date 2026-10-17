import { test } from '../support/merged-fixtures';

test.describe('inbox messages', () => {
  test('inbox messages case 01', async ({ work }) => {
    await work(1000);
  });

  test('inbox messages case 02', async ({ work }) => {
    await work(900);
  });

  test('inbox messages case 03', async ({ work }) => {
    await work(800);
  });

  test('inbox messages case 04', async ({ work }) => {
    await work(500);
  });

  test('inbox messages case 05', async ({ work }) => {
    await work(200);
  });

  test('inbox messages case 06', async ({ work }) => {
    await work(1100);
  });

  test('inbox messages case 07', async ({ work }) => {
    await work(800);
  });

  test('inbox messages case 08', async ({ work }) => {
    await work(1100);
  });

  test('inbox messages case 09', async ({ work }) => {
    await work(400);
  });

  test('inbox messages case 10', async ({ work }) => {
    await work(800);
  });

  test('inbox messages case 11', async ({ work }) => {
    await work(600);
  });

  test('inbox messages case 12', async ({ work }) => {
    await work(1100);
  });

  test('inbox messages case 13', async ({ work }) => {
    await work(1000);
  });

  test('inbox messages case 14', async ({ work }) => {
    await work(800);
  });
});
