import { test } from '../support/merged-fixtures';

test.describe('settings privacy', () => {
  test('settings privacy case 01', async ({ work }) => {
    await work(900);
  });

  test('settings privacy case 02', async ({ work }) => {
    await work(1100);
  });

  test('settings privacy case 03', async ({ work }) => {
    await work(900);
  });

  test('settings privacy case 04', async ({ work }) => {
    await work(900);
  });

  test('settings privacy case 05', async ({ work }) => {
    await work(1100);
  });

  test('settings privacy case 06', async ({ work }) => {
    await work(1000);
  });

  test('settings privacy case 07', async ({ work }) => {
    await work(300);
  });

  test('settings privacy case 08', async ({ work }) => {
    await work(800);
  });

  test('settings privacy case 09', async ({ work }) => {
    await work(500);
  });

  test('settings privacy case 10', async ({ work }) => {
    await work(1100);
  });

  test('settings privacy case 11', async ({ work }) => {
    await work(700);
  });

  test('settings privacy case 12', async ({ work }) => {
    await work(1100);
  });
});
