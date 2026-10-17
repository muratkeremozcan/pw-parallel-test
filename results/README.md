# Measurements

`results/raw/` holds one JSON record per measured GitHub Actions run, and `RESULTS.md` at the
repository root is rendered from those records only. No number is typed by hand.

## Suites

RESULTS.md renders one section per suite fingerprint, the newest first, and never compares numbers
across them.

- The current suite: 605 tests in 67 spec files and a setup project, 531 s of test time. Its longest
  spec file takes 11.7 s, under the equal share of a worker at every measured layout up to 8 shards
  of 4 workers, while native count-based sharding still piles the few-test heavy specs onto two or
  three shards. It runs with `fullyParallel` off or on, from the workflows' `fully-parallel` input.
- History, suite `tests@3259c416b64e`: 222 tests in 33 spec files, 421 s of test time, measured
  mostly at 1 worker per shard. One 55 s spec file bounded every layout of 8 or more workers in
  all, so its 4-worker rows measure that file alone. Its records stay in `results/raw/` and
  render under the history heading.

## Method

- `.github/workflows/native.yml` runs native `--shard=i/N` from a `workflow_dispatch` input. Each
  shard uploads a blob report; a merge job merges them and fails unless every test ran exactly once, and each setup test once per shard.
- `.github/workflows/smart.yml` runs the same suite through
  [playwright-smart-parallelization](https://github.com/muratkeremozcan/playwright-smart-parallelization),
  set up as its README shows. From Action 65d649d that is native.yml's shard job with the Action's
  step before `npx playwright test --shard=i/N $PSP_ARGS`, native.yml's own blob upload and merge,
  and the Action's optional finish in the merge job. Earlier pins ran the Action's prepare, run and
  finish phases. Campaign runs of 063aba8 dispatched on `main` and published the Action's duration
  history there; confirmation runs of 01187a8 and cfce541 dispatched from a pull request's branch
  under `publish-history: auto`, read main's history and published none, and RESULTS.md notes
  them. smart.yml at 65d649d sets `publish-history: true`, so runs dispatched from a pull request's
  branch publish into that branch's own cache scope and its warm runs balance from the history its
  cold run published. A rollback reads and writes no history on any branch. Its `enabled` input is
  the rollback switch. The record keeps the mode the Action chose: `balanced` counts as the smart
  arm, `native` with no history as the cold start, and `disabled` as the rollback.
- Both workflows take an optional `workers` input: native.yml passes it as `--workers`, smart.yml
  as `--workers` and as the Action's `workers` input, which packs the plan for them, so a rollback
  with its empty `$PSP_ARGS` keeps them too. The history key includes
  the workers, so each worker count starts with a cold run of its own.
- Both workflows take a `fully-parallel` input, which sets `PW_FULLY_PARALLEL` and so the config's
  `fullyParallel`. The config also writes the value into its metadata, which each shard's blob
  report carries, and a record whose blobs disagree with the input is refused. The Action keeps a
  whole spec file as its unit either way; native sharding splits a fully parallel suite by test.
- From the current suite smart.yml pins Action c439738 and sets `history-key` to the shard count,
  plus `-fully-parallel` when that input is on, so every arm of shards, workers and
  `fullyParallel` warms from a cold run of its own.
- Runs are dispatched one at a time, each only once no workflow run of the repository is active,
  and the next waits until the previous one completes, so
  measured runs never compete for runners. The workflow's concurrency group also keeps a second run from starting while one executes; it holds at most one waiting run, and a later dispatch cancels it.
- A record is accepted only for a first-attempt `workflow_dispatch` run of the arm's workflow, and
  carries a suite fingerprint: the git tree of `tests/` plus the blobs of `playwright.config.ts` and
  `package-lock.json` at the run's commit. RESULTS.md refuses records whose fingerprints differ, so
  every number describes one suite.
- A run is left out only when it cannot be measured, and is listed here. Rollback run
  [38995303917](https://github.com/muratkeremozcan/pw-parallel-test/actions/runs/38995303917) on
  Action 01187a8 uploaded no blob report. In disabled mode that pin set no
  `PLAYWRIGHT_BLOB_OUTPUT_*` variables, so the config's blob reporter wrote `./blob-report` while the
  Action uploaded its own empty folder, and the run has no Playwright times. Action cfce541 sets
  those variables in disabled mode too, so the config's reporter writes into the Action's folder,
  and the rollback was measured again there.
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
# an arm takes an optional workers count, and --ref a branch
node scripts/measure/campaign.ts --arms native:4:2,smart:4:2 --ref <branch>
# and :fp dispatches with fully-parallel on
node scripts/measure/campaign.ts --arms smart:4:2:fp,native:4:2:fp --ref <branch>

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
  count times the workers per shard and the longest indivisible unit. With `fullyParallel` off, a
  spec file is that unit; on, a test is, and the tests tagged `@serial` form one unit per serial
  describe. Test durations are medians over all native runs of the suite.

The collector and blob reducer are trimmed from `measurements/` on the `s6-candidates` branch of
[playwright-smart-parallelization](https://github.com/muratkeremozcan/playwright-smart-parallelization)
(MIT, same author).
