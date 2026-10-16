# Measurements

`results/raw/` holds one JSON record per measured GitHub Actions run, and `RESULTS.md` at the
repository root is rendered from those records only. No number is typed by hand.

## Method

- `.github/workflows/native.yml` runs native `--shard=i/N` from a `workflow_dispatch` input. Each
  shard uploads a blob report; a merge job merges them and fails unless every test ran exactly once.
- Runs are dispatched one at a time, and the next waits until the previous one completes, so
  measured runs never compete for runners. The workflow's concurrency group queues any overlap.
- A record keeps the run, every job with its created, started and completed timestamps from the
  Actions API, and each shard's blob report reduced to versions, the run window and per-test
  durations. Absolute paths and environment data in the blob are dropped.

## Commands

```sh
# dispatch, wait for and collect runs in order
node scripts/measure/campaign.ts --arms native:4,native:8,native:4,native:8,native:4,native:8

# collect one finished run
node scripts/measure/collect.ts --run <run id>

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
