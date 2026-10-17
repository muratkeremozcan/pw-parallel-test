import { test } from '../support/merged-fixtures';

test.describe('admin flags', () => {
  test('admin flags case 01', async ({ work }) => {
    await work(600);
  });

  test('admin flags case 02', async ({ work }) => {
    await work(900);
  });

  test('admin flags case 03', async ({ work }) => {
    await work(800);
  });

  test('admin flags case 04', async ({ work }) => {
    await work(1000);
  });

  test('admin flags case 05', async ({ work }) => {
    await work(500);
  });

  test('admin flags case 06', async ({ work }) => {
    await work(300);
  });

  test('admin flags case 07', async ({ work }) => {
    await work(600);
  });

  test('admin flags case 08', async ({ work }) => {
    await work(200);
  });

  test('admin flags case 09', async ({ work }) => {
    await work(1100);
  });

  test('admin flags case 10', async ({ work }) => {
    await work(500);
  });

  test('admin flags case 11', async ({ work }) => {
    await work(900);
  });

  test('admin flags case 12', async ({ work }) => {
    await work(700);
  });
});
