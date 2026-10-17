import { test } from '../support/merged-fixtures';

test.describe('invoices detail', () => {
  test('invoices detail case 01', async ({ work }) => {
    await work(700);
  });

  test('invoices detail case 02', async ({ work }) => {
    await work(1100);
  });

  test('invoices detail case 03', async ({ work }) => {
    await work(500);
  });

  test('invoices detail case 04', async ({ work }) => {
    await work(500);
  });

  test('invoices detail case 05', async ({ work }) => {
    await work(500);
  });

  test('invoices detail case 06', async ({ work }) => {
    await work(600);
  });

  test('invoices detail case 07', async ({ work }) => {
    await work(500);
  });

  test('invoices detail case 08', async ({ work }) => {
    await work(200);
  });

  test('invoices detail case 09', async ({ work }) => {
    await work(600);
  });

  test('invoices detail case 10', async ({ work }) => {
    await work(400);
  });
});
