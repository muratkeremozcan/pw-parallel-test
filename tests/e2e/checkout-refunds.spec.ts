import { test } from '../support/merged-fixtures';

test.describe('checkout refunds', () => {
  test('checkout refunds case 01', async ({ work }) => {
    await work(8700);
  });

  test('checkout refunds case 02', async ({ work }) => {
    await work(9200);
  });

  test('checkout refunds case 03', async ({ work }) => {
    await work(7700);
  });

  test('checkout refunds case 04', async ({ work }) => {
    await work(7700);
  });

  test('checkout refunds case 05', async ({ work }) => {
    await work(8700);
  });
});
