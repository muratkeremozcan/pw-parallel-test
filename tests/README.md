# Test suite

Scaffolded with BMad TEA (`bmad-tea-framework`) on Playwright with
`@seontechnologies/playwright-utils`. The suite has no application: every test waits a fixed,
committed duration, so a run is identical every time and shard balance is the only variable.

## Setup

```sh
nvm use        # Node from .nvmrc
npm ci
```

No browser download is needed. No test requests `page`, so Playwright never launches one.

## Running

```sh
npm test                          # whole suite, 1 worker, about 7 minutes
npx playwright test --workers=8   # same suite, faster locally
npx playwright test --shard=2/4   # one native shard
npm run test:list                 # list tests without running them
npm run test:burn-in-changed      # repeat the specs changed against main
npm run lint                      # tsc and Prettier
```

`--headed` and `--debug` work as usual but show nothing, because no test opens a browser.

## Shape

| Kind                    | Files | Tests | Fixed time |
| ----------------------- | ----- | ----- | ---------- |
| Setup project           | 1     | 1     | 3 s        |
| Heavy specs             | 5     | 24    | 24 to 55 s |
| Serial group            | 1     | 8     | 17.8 s     |
| Light specs, 0.2 to 2 s | 26    | 189   | 4 to 12 s  |

The chromium project depends on the setup project, so Playwright runs the setup test once in every
shard. `fullyParallel` stays at Playwright's default (false), which makes a spec file the unit native
sharding distributes. Retries are 0 and workers are 1 per shard, so a shard's run time is the sum of
its tests.

## Architecture

- `support/merged-fixtures.ts` is the only place specs import `test` from. It merges the
  playwright-utils `apiRequest` and `recurse` fixtures with the project's `work` fixture and
  re-exports `expect` and `log`.
- `support/fixtures/work-fixture.ts` exposes `work(ms)`, a fixture shell over the pure
  `support/helpers/simulate-work.ts`.
- `setup/` holds the setup project; `e2e/` holds the specs; `config/burn-in.config.ts` configures
  playwright-utils burn-in.

Deviations from the TEA scaffold, each because the surface does not exist here:

- `interceptNetworkCall` and `network-error-monitor` are not merged. There is no browser surface,
  and `network-error-monitor` is an auto fixture that opens a page in every test, which would add a
  browser launch to each measured duration.
- No auth fixture, data factories or `.env.example`: there is no application, auth endpoint, data or
  base URL.
- `log` is imported from `@seontechnologies/playwright-utils/log`. The package root import fails to
  load under `"type": "module"` with Playwright 1.64.1 (`request for './index.js' is not in cache`).
- TypeScript stays on 6.x. playwright-utils burn-in analyzes imports through `madge`, whose
  `@typescript-eslint/typescript-estree` needs the TypeScript JS API that TypeScript 7 removed
  (`Cannot read properties of undefined (reading 'BarBarToken')`).

## Best practices that still apply

- Specs import from `support/merged-fixtures`, never from `@playwright/test`.
- Durations are literals in the spec files. Do not compute or randomize them, or runs stop being
  comparable.
- Every test is independent except the serial group, which is serial on purpose.

## CI

`.github/workflows/test.yml` runs on pull requests and pushes to `main`:

1. Lint (`npm run lint`).
2. Four native shards, each uploading a blob report even on failure.
3. A merge job that merges the blobs into HTML, JSON and JUnit, then fails unless every discovered
   test ran exactly once, and each setup test once per shard (`scripts/check-test-count.ts`).
4. Burn-in on pull requests through `scripts/burn-in-changed.ts`: three repeats, no retries. When
   only spec files changed, playwright-utils `runBurnIn` picks them. When anything a spec
   imports or runs under changed, the whole suite burns in, because playwright-utils 4.4.1 selects a
   spec only when that spec file itself changed. A changed file name outside `[A-Za-z0-9._/-]`
   stops burn-in, because `runBurnIn` passes names through a shell. A weekly schedule burns in the
   whole suite.

## Write-time enforcement

`.claude/hooks/tea-enforce.cjs` is TEA's write-time hook, copied byte for byte and registered in
`.claude/settings.json` for Claude Code. It blocks focused tests (C2), tautological assertions (C3),
hard waits (H1) and oversize files (H5), and warns on disabled tests (C1), in files matching
`testGlobs` in `.tea/enforce-config.json`. Severity comes from the TEA test-review criteria
registry, not from the hook. `simulateWork` uses `setTimeout` directly, which H1 does not match:
the timer is the subject under measurement here, not a synchronization shortcut. To turn a rule off,
add its id to `disabledRules` and give the reason in the commit.

## Knowledge fragments applied

`playwright-utils-mandate.md`, `overview.md`, `fixtures-composition.md`, `fixture-architecture.md`,
`log.md`, `recurse.md`, `api-request.md`, `burn-in.md`, `ci-burn-in.md`, `playwright-config.md`.
