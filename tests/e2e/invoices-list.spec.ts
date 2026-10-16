import { test } from '../support/merged-fixtures';

test.describe('invoices list', () => {
  test('invoices list case 01', async ({ work }) => {
    await work(1600);
  });

  test('invoices list case 02', async ({ work }) => {
    await work(1600);
  });

  test('invoices list case 03', async ({ work }) => {
    await work(400);
  });

  test('invoices list case 04', async ({ work }) => {
    await work(1600);
  });

  test('invoices list case 05', async ({ work }) => {
    await work(800);
  });

  test('invoices list case 06', async ({ work }) => {
    await work(700);
  });

  test('invoices list case 07', async ({ work }) => {
    await work(900);
  });
});
