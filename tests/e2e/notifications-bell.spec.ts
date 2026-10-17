import { test } from '../support/merged-fixtures';

test.describe('notifications bell', () => {
  test('notifications bell case 01', async ({ work }) => {
    await work(500);
  });

  test('notifications bell case 02', async ({ work }) => {
    await work(700);
  });

  test('notifications bell case 03', async ({ work }) => {
    await work(1100);
  });

  test('notifications bell case 04', async ({ work }) => {
    await work(400);
  });

  test('notifications bell case 05', async ({ work }) => {
    await work(800);
  });

  test('notifications bell case 06', async ({ work }) => {
    await work(300);
  });

  test('notifications bell case 07', async ({ work }) => {
    await work(900);
  });

  test('notifications bell case 08', async ({ work }) => {
    await work(700);
  });

  test('notifications bell case 09', async ({ work }) => {
    await work(200);
  });

  test('notifications bell case 10', async ({ work }) => {
    await work(1000);
  });

  test('notifications bell case 11', async ({ work }) => {
    await work(300);
  });

  test('notifications bell case 12', async ({ work }) => {
    await work(300);
  });
});
