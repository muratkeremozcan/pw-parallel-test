import { test } from '../support/merged-fixtures';

test.describe('inbox labels', () => {
  test('inbox labels case 01', async ({ work }) => {
    await work(700);
  });

  test('inbox labels case 02', async ({ work }) => {
    await work(800);
  });

  test('inbox labels case 03', async ({ work }) => {
    await work(700);
  });

  test('inbox labels case 04', async ({ work }) => {
    await work(400);
  });

  test('inbox labels case 05', async ({ work }) => {
    await work(300);
  });

  test('inbox labels case 06', async ({ work }) => {
    await work(800);
  });

  test('inbox labels case 07', async ({ work }) => {
    await work(700);
  });

  test('inbox labels case 08', async ({ work }) => {
    await work(800);
  });

  test('inbox labels case 09', async ({ work }) => {
    await work(900);
  });

  test('inbox labels case 10', async ({ work }) => {
    await work(900);
  });

  test('inbox labels case 11', async ({ work }) => {
    await work(1100);
  });

  test('inbox labels case 12', async ({ work }) => {
    await work(1100);
  });
});
