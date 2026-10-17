import { test } from '../support/merged-fixtures';

test.describe('billing usage', () => {
  test('billing usage case 01', async ({ work }) => {
    await work(700);
  });

  test('billing usage case 02', async ({ work }) => {
    await work(600);
  });

  test('billing usage case 03', async ({ work }) => {
    await work(700);
  });

  test('billing usage case 04', async ({ work }) => {
    await work(400);
  });

  test('billing usage case 05', async ({ work }) => {
    await work(400);
  });

  test('billing usage case 06', async ({ work }) => {
    await work(200);
  });

  test('billing usage case 07', async ({ work }) => {
    await work(500);
  });

  test('billing usage case 08', async ({ work }) => {
    await work(1100);
  });

  test('billing usage case 09', async ({ work }) => {
    await work(800);
  });

  test('billing usage case 10', async ({ work }) => {
    await work(400);
  });

  test('billing usage case 11', async ({ work }) => {
    await work(900);
  });

  test('billing usage case 12', async ({ work }) => {
    await work(400);
  });
});
