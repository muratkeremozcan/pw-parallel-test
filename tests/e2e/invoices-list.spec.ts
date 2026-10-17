import { test } from '../support/merged-fixtures';

test.describe('invoices list', () => {
  test('invoices list case 01', async ({ work }) => {
    await work(1100);
  });

  test('invoices list case 02', async ({ work }) => {
    await work(300);
  });

  test('invoices list case 03', async ({ work }) => {
    await work(1100);
  });

  test('invoices list case 04', async ({ work }) => {
    await work(300);
  });

  test('invoices list case 05', async ({ work }) => {
    await work(1000);
  });

  test('invoices list case 06', async ({ work }) => {
    await work(500);
  });

  test('invoices list case 07', async ({ work }) => {
    await work(400);
  });

  test('invoices list case 08', async ({ work }) => {
    await work(200);
  });
});
