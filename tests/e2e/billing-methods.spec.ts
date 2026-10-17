import { test } from '../support/merged-fixtures';

test.describe('billing methods', () => {
  test('billing methods case 01', async ({ work }) => {
    await work(1000);
  });

  test('billing methods case 02', async ({ work }) => {
    await work(400);
  });

  test('billing methods case 03', async ({ work }) => {
    await work(200);
  });

  test('billing methods case 04', async ({ work }) => {
    await work(700);
  });

  test('billing methods case 05', async ({ work }) => {
    await work(900);
  });

  test('billing methods case 06', async ({ work }) => {
    await work(800);
  });

  test('billing methods case 07', async ({ work }) => {
    await work(400);
  });

  test('billing methods case 08', async ({ work }) => {
    await work(900);
  });

  test('billing methods case 09', async ({ work }) => {
    await work(1100);
  });

  test('billing methods case 10', async ({ work }) => {
    await work(300);
  });

  test('billing methods case 11', async ({ work }) => {
    await work(200);
  });

  test('billing methods case 12', async ({ work }) => {
    await work(400);
  });
});
