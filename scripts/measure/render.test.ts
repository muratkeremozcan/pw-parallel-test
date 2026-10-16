import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reduceBlob } from './blob.ts';
import type { JobRecord, RunRecord } from './collect.ts';
import { idealBounds, median, metricsOf, render } from './render.ts';

const line = (method: string, params: unknown) => JSON.stringify({ method, params });

/** A blob report with a setup test and the given chromium tests, as `[file, ms]` pairs. */
const blob = (current: number, total: number, tests: [string, number][]) => {
  const entry = (id: string, file: string) => ({
    testId: id,
    title: id,
    location: { file },
    repeatEachIndex: 0,
  });
  const lines = [
    line('onBlobReportMetadata', {
      userAgent: 'Playwright/1.64.1 node/24.1',
      shard: { current, total },
    }),
    line('onConfigure', { config: { version: '1.64.1', workers: 1 } }),
    line('onProject', {
      project: {
        name: 'setup',
        dependencies: [],
        suites: [{ title: 'setup/a.setup.ts', entries: [entry('setup', 'setup/a.setup.ts')] }],
      },
    }),
    line('onProject', {
      project: {
        name: 'chromium',
        dependencies: ['setup'],
        suites: tests.map(([file], i) => ({
          title: file,
          entries: [entry(`t${current}-${i}`, file)],
        })),
      },
    }),
  ];
  const run = (id: string, ms: number) => [
    line('onTestBegin', { testId: id, result: { id: `${id}-r`, retry: 0 } }),
    line('onTestEnd', {
      test: { testId: id },
      result: { id: `${id}-r`, duration: ms, status: 'passed' },
    }),
  ];
  lines.push(...run('setup', 3000));
  tests.forEach(([, ms], i) => lines.push(...run(`t${current}-${i}`, ms)));
  const duration = 3000 + tests.reduce((sum, [, ms]) => sum + ms, 0);
  lines.push(line('onEnd', { result: { status: 'passed', startTime: 0, duration } }));
  return lines.join('\n');
};

const job = (name: string, created: number, start: number, end: number): JobRecord => ({
  id: start,
  name,
  conclusion: 'success',
  createdAt: new Date(created * 1000).toISOString(),
  startedAt: new Date(start * 1000).toISOString(),
  completedAt: new Date(end * 1000).toISOString(),
  runnerName: 'runner',
  labels: ['ubuntu-latest'],
});

const record = (): RunRecord => ({
  schema: 1,
  repo: 'muratkeremozcan/pw-parallel-test',
  mode: 'native',
  run: {
    id: 42,
    attempt: 1,
    workflowPath: '.github/workflows/native.yml',
    event: 'workflow_dispatch',
    headBranch: 'main',
    headSha: 'a'.repeat(40),
    conclusion: 'success',
    createdAt: new Date(0).toISOString(),
    runStartedAt: new Date(0).toISOString(),
    updatedAt: new Date(200_000).toISOString(),
  },
  shardCount: 2,
  jobs: [
    job('Plan', 0, 1, 5),
    job('Shard 1/2', 5, 10, 70),
    job('Shard 2/2', 5, 12, 40),
    job('Merge reports', 70, 75, 90),
  ],
  shards: [
    reduceBlob(
      blob(1, 2, [
        ['e2e/heavy.spec.ts', 40_000],
        ['e2e/heavy.spec.ts', 10_000],
      ]),
    ),
    reduceBlob(
      blob(2, 2, [
        ['e2e/a.spec.ts', 5000],
        ['e2e/b.spec.ts', 15_000],
      ]),
    ),
  ],
});

test('median handles odd and even counts', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.throws(() => median([]));
});

test('reduceBlob keeps only executed tests and the shard window', () => {
  const shard = record().shards[0];
  assert.deepEqual(shard.shard, { current: 1, total: 2 });
  assert.equal(shard.run.duration, 53_000);
  assert.equal(shard.tests.length, 3);
  assert.deepEqual(shard.projects[1], { name: 'chromium', dependencies: ['setup'] });
});

test('reduceBlob rejects an attempt that never ended', () => {
  const text = blob(1, 1, [['e2e/a.spec.ts', 100]])
    .split('\n')
    .filter((l) => !l.includes('"onTestEnd"') || !l.includes('t1-0'))
    .join('\n');
  assert.throws(() => reduceBlob(text), /began but never ended/);
});

test('metricsOf derives shard, completion, queue and machine time', () => {
  const m = metricsOf(record());
  assert.deepEqual(m.shardJobSeconds, [60, 28]);
  assert.deepEqual(m.shardPlaywrightSeconds, [53, 23]);
  assert.equal(m.slowestPlaywright, 53);
  assert.equal(m.playwrightSpread, 30);
  assert.equal(m.jobSpread, 32);
  assert.equal(m.completion, 89);
  assert.equal(m.queueMax, 7);
  assert.equal(m.machine, 88);
});

test('metricsOf refuses a run with a failed job', () => {
  const failed = record();
  failed.jobs[1].conclusion = 'failure';
  assert.throws(() => metricsOf(failed), /did not succeed/);
});

test('idealBounds floors the equal share at the longest file and adds setup per shard', () => {
  const [two, four] = idealBounds([record()], [2, 4]);
  assert.equal(two.totalSeconds, 70);
  assert.equal(two.longestUnitSeconds, 50);
  assert.equal(two.longestUnit, 'chromium › e2e/heavy.spec.ts');
  assert.equal(two.setupSeconds, 3);
  assert.equal(two.idealSeconds, 53);
  assert.equal(four.idealSeconds, 53);
});

test('render produces the summary, bound and run tables', () => {
  const text = render([record()]);
  assert.match(text, /Generated by scripts\/measure\/render\.ts/);
  assert.match(text, /\| native \| 2 \| 1 \| 53\.0 s \| 53\.0 s \| 30\.0 s \|/);
  assert.match(text, /actions\/runs\/42\)/);
});

test('idealBounds is empty without native runs, and render still succeeds', () => {
  const smart = { ...record(), mode: 'smart' };
  assert.deepEqual(idealBounds([], [2]), []);
  assert.doesNotMatch(render([smart]), /## Ideal bound/);
});
