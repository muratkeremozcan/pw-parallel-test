import { test } from '../support/merged-fixtures';

test.describe('invoices download', () => {
  test('invoices download case 01', async ({ work }) => {
    await work(900);
  });

  test('invoices download case 02', async ({ work }) => {
    await work(1100);
  });

  test('invoices download case 03', async ({ work }) => {
    await work(300);
  });

  test('invoices download case 04', async ({ work }) => {
    await work(400);
  });

  test('invoices download case 05', async ({ work }) => {
    await work(400);
  });

  test('invoices download case 06', async ({ work }) => {
    await work(400);
  });

  test('invoices download case 07', async ({ work }) => {
    await work(1000);
  });

  test('invoices download case 08', async ({ work }) => {
    await work(300);
  });

  test('invoices download case 09', async ({ work }) => {
    await work(400);
  });

  test('invoices download case 10', async ({ work }) => {
    await work(1100);
  });

  test('invoices download case 11', async ({ work }) => {
    await work(400);
  });

  test('invoices download case 12', async ({ work }) => {
    await work(500);
  });

  test('invoices download case 13', async ({ work }) => {
    await work(1000);
  });
});
