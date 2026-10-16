import { test } from '../support/merged-fixtures';

// Serial group: the cases run in order on one worker, so the group is one indivisible unit.
test.describe('serial ledger', () => {
  test.describe.configure({ mode: 'serial' });

  test('serial ledger case 01', async ({ work }) => {
    await work(2300);
  });

  test('serial ledger case 02', async ({ work }) => {
    await work(1800);
  });

  test('serial ledger case 03', async ({ work }) => {
    await work(2800);
  });

  test('serial ledger case 04', async ({ work }) => {
    await work(2900);
  });

  test('serial ledger case 05', async ({ work }) => {
    await work(1700);
  });

  test('serial ledger case 06', async ({ work }) => {
    await work(1800);
  });

  test('serial ledger case 07', async ({ work }) => {
    await work(2200);
  });

  test('serial ledger case 08', async ({ work }) => {
    await work(2300);
  });
});
