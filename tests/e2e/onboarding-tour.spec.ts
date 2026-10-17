import { test } from '../support/merged-fixtures';

test.describe('onboarding tour', () => {
  test('onboarding tour case 01', async ({ work }) => {
    await work(200);
  });

  test('onboarding tour case 02', async ({ work }) => {
    await work(500);
  });

  test('onboarding tour case 03', async ({ work }) => {
    await work(500);
  });

  test('onboarding tour case 04', async ({ work }) => {
    await work(500);
  });

  test('onboarding tour case 05', async ({ work }) => {
    await work(200);
  });

  test('onboarding tour case 06', async ({ work }) => {
    await work(900);
  });

  test('onboarding tour case 07', async ({ work }) => {
    await work(600);
  });

  test('onboarding tour case 08', async ({ work }) => {
    await work(1000);
  });

  test('onboarding tour case 09', async ({ work }) => {
    await work(1000);
  });
});
