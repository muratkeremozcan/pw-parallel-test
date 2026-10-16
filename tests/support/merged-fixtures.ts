import { mergeTests } from '@playwright/test';
import { log } from '@seontechnologies/playwright-utils/log';
import { test as apiRequestFixture } from '@seontechnologies/playwright-utils/api-request/fixtures';
import { test as recurseFixture } from '@seontechnologies/playwright-utils/recurse/fixtures';
// Project-owned:
import { test as workFixture } from './fixtures/work-fixture';

// playwright-utils deviation: interceptNetworkCall and network-error-monitor are left out. The
// suite has no browser surface, and network-error-monitor is an auto fixture that opens a page for
// every test, which would add a browser launch to each test's measured duration.
// playwright-utils deviation: no auth fixture. The suite has no application and no auth endpoint.
export const test = mergeTests(apiRequestFixture, recurseFixture, workFixture);

export { expect } from '@playwright/test';
export { log };
