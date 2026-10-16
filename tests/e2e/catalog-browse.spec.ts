import { test } from '../support/merged-fixtures';

test.describe('catalog browse', () => {
  test('catalog browse case 01', async ({ work }) => {
    await work(1300);
  });

  test('catalog browse case 02', async ({ work }) => {
    await work(1000);
  });

  test('catalog browse case 03', async ({ work }) => {
    await work(300);
  });

  test('catalog browse case 04', async ({ work }) => {
    await work(1900);
  });

  test('catalog browse case 05', async ({ work }) => {
    await work(1200);
  });

  test('catalog browse case 06', async ({ work }) => {
    await work(1000);
  });

  test('catalog browse case 07', async ({ work }) => {
    await work(600);
  });

  test('catalog browse case 08', async ({ work }) => {
    await work(1700);
  });

  test('catalog browse case 09', async ({ work }) => {
    await work(1000);
  });
});
