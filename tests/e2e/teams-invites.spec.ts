import { test } from '../support/merged-fixtures';

test.describe('teams invites', () => {
  test('teams invites case 01', async ({ work }) => {
    await work(300);
  });

  test('teams invites case 02', async ({ work }) => {
    await work(1100);
  });

  test('teams invites case 03', async ({ work }) => {
    await work(300);
  });

  test('teams invites case 04', async ({ work }) => {
    await work(800);
  });

  test('teams invites case 05', async ({ work }) => {
    await work(600);
  });

  test('teams invites case 06', async ({ work }) => {
    await work(1000);
  });

  test('teams invites case 07', async ({ work }) => {
    await work(800);
  });

  test('teams invites case 08', async ({ work }) => {
    await work(200);
  });

  test('teams invites case 09', async ({ work }) => {
    await work(500);
  });
});
