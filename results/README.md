# Measurements

`results/raw/` holds one JSON record per measured GitHub Actions run, and `RESULTS.md` at the
repository root is rendered from those records only. No number is typed by hand.

## Method

- `.github/workflows/native.yml` runs native `--shard=i/N` from a `workflow_dispatch` input. Each
  shard uploads a blob report; a merge job merges them and fails unless every test ran exactly once, and each setup test once per shard.
- `.github/workflows/smart.yml` runs the same suite through
  [playwright-smart-parallelization](https://github.com/muratkeremozcan/playwright-smart-parallelization),
  set up as its README shows. Campaign runs dispatch on `main`, so they publish the Action's
  duration history. Confirmation runs of a newer Action pin dispatch from the pull request's
  branch: under `publish-history: auto` they read main's history and publish none, so their finish
  job skips the history write, and RESULTS.md notes it. Its `enabled` input is the rollback switch. The record keeps the mode the Action's prepare job chose: `balanced`
  counts as the smart arm, `native` with no history as the cold start, and `disabled` as the
  rollback.
- Runs are dispatched one at a time, each only once no workflow run of the repository is active,
  and the next waits until the previous one completes, so
  measured runs never compete for runners. The workflow's concurrency group also keeps a second run from starting while one executes; it holds at most one waiting run, and a later dispatch cancels it.
- A record is accepted only for a first-attempt `workflow_dispatch` run of the arm's workflow, and
  carries a suite fingerprint: the git tree of `tests/` plus the blobs of `playwright.config.ts` and
  `package-lock.json` at the run's commit. RESULTS.md refuses records whose fingerprints differ, so
  every number describes one suite.
- A run is left out only when it cannot be measured, and is listed here. Rollback run
  [38995303917](https://github.com/muratkeremozcan/pw-parallel-test/actions/runs/38995303917) on
  Action 01187a8 uploaded no blob report: in disabled mode that pin adds no blob reporter output
  folder and uploads only its own, so the config's `./blob-report` stays on the runner, and the run
  has no Playwright times.
- Each record lists any other run of the repository whose jobs overlapped it, and RESULTS.md
  shows them, because overlapping runs share the account's runner pool.
- A record keeps the run, every job with its created, started and completed timestamps from the
  Actions API, and each shard's blob report reduced to versions, the run window and per-test
  durations. Absolute paths and environment data in the blob are dropped.

## Commands

```sh
# dispatch, wait for and collect runs in order
node scripts/measure/campaign.ts --arms native:4,native:8,native:4,native:8,native:4,native:8
node scripts/measure/campaign.ts --arms smart:4,native:4,smart:4,native:8,smart:8,rollback:4

# collect one finished run
node scripts/measure/collect.ts --run <run id> --mode native|smart|rollback

# render RESULTS.md
node scripts/measure/render.ts
```

## Metrics

- Slowest shard and spread (slowest minus fastest), for job durations and for Playwright's own run
  time per shard.
- Completion: first job start to last job end in the run.
- Queue: the longest wait of a shard job between creation and start.
- Machine time: the sum of shard job durations.
- Ideal bound: the setup project's time, plus the larger of total test time divided by the shard
  count and the longest indivisible unit. With `fullyParallel` off, a spec file is that unit. Test
  durations are medians over all native runs.

The collector and blob reducer are trimmed from `measurements/` on the `s6-candidates` branch of
[playwright-smart-parallelization](https://github.com/muratkeremozcan/playwright-smart-parallelization)
(MIT, same author).
