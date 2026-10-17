import { test } from '../support/merged-fixtures';

test.describe('checkout refunds', () => {
  test('checkout refunds case 01', async ({ work }) => {
    await work(5700);
  });

  test('checkout refunds case 02', async ({ work }) => {
    await work(5600);
  });
});
