import { test } from '../support/merged-fixtures';

test.describe('account sessions', () => {
  test('account sessions case 01', async ({ work }) => {
    await work(800);
  });

  test('account sessions case 02', async ({ work }) => {
    await work(200);
  });

  test('account sessions case 03', async ({ work }) => {
    await work(400);
  });

  test('account sessions case 04', async ({ work }) => {
    await work(200);
  });

  test('account sessions case 05', async ({ work }) => {
    await work(1100);
  });

  test('account sessions case 06', async ({ work }) => {
    await work(1100);
  });

  test('account sessions case 07', async ({ work }) => {
    await work(400);
  });

  test('account sessions case 08', async ({ work }) => {
    await work(1000);
  });

  test('account sessions case 09', async ({ work }) => {
    await work(400);
  });

  test('account sessions case 10', async ({ work }) => {
    await work(600);
  });

  test('account sessions case 11', async ({ work }) => {
    await work(200);
  });

  test('account sessions case 12', async ({ work }) => {
    await work(200);
  });
});
