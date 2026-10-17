import { test } from '../support/merged-fixtures';

// Serial group: the cases run in order on one worker, so the group is one indivisible unit even
// under fullyParallel. The @serial tag tells scripts/measure/render.ts so in its ideal bound.
test.describe('serial ledger', { tag: '@serial' }, () => {
  test.describe.configure({ mode: 'serial' });

  test('serial ledger case 01', async ({ work }) => {
    await work(1000);
  });

  test('serial ledger case 02', async ({ work }) => {
    await work(1500);
  });

  test('serial ledger case 03', async ({ work }) => {
    await work(1000);
  });

  test('serial ledger case 04', async ({ work }) => {
    await work(1000);
  });

  test('serial ledger case 05', async ({ work }) => {
    await work(1500);
  });

  test('serial ledger case 06', async ({ work }) => {
    await work(1200);
  });

  test('serial ledger case 07', async ({ work }) => {
    await work(1100);
  });

  test('serial ledger case 08', async ({ work }) => {
    await work(1400);
  });
});
