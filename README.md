# pw-parallel-test

A synthetic Playwright suite for measuring how evenly CI shards balance. Every test only sleeps for a
fixed time, so the suite runs the same way on every run and the only variable is how tests are split
across shards.

It compares Playwright's native count-based `--shard` against
[playwright-smart-parallelization](https://github.com/muratkeremozcan/playwright-smart-parallelization).
