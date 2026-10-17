import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reduceBlob } from './blob.ts';
import type { JobRecord, RunRecord } from './collect.ts';
import { armOf, executedTests, idealBounds, median, metricsOf, render } from './render.ts';

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
        retries: 0,
        suites: [{ title: 'setup/a.setup.ts', entries: [entry('setup', 'setup/a.setup.ts')] }],
      },
    }),
    line('onProject', {
      project: {
        name: 'chromium',
        dependencies: ['setup'],
        retries: 0,
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
  schema: 2,
  repo: 'muratkeremozcan/pw-parallel-test',
  mode: 'native',
  run: {
    id: 42,
    attempt: 1,
    workflowPath: '.github/workflows/native.yml',
    event: 'workflow_dispatch',
    headBranch: 'main',
    headSha: 'a'.repeat(40),
    suiteFingerprint: 'tests@aaaa playwright.config.ts@bbbb package-lock.json@cccc',
    overlappingRuns: [{ id: 7, workflowPath: '.github/workflows/test.yml', event: 'push' }],
    conclusion: 'success',
    createdAt: new Date(0).toISOString(),
    runStartedAt: new Date(0).toISOString(),
    updatedAt: new Date(200_000).toISOString(),
  },
  shardCount: 2,
  action: null,
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
  assert.deepEqual(shard.projects[1], { name: 'chromium', dependencies: ['setup'], retries: 0 });
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
  assert.match(text, /\| native \| 2 \| 1 \| 53\.0 s \| 0% \| 53\.0 s \| 30\.0 s \|/);
  assert.match(text, /actions\/runs\/42\)/);
  assert.match(
    text,
    /- native, 2 shards: \[42\]\(https:\/\/github\.com\/muratkeremozcan\/pw-parallel-test\/actions\/runs\/42\)/,
  );
  assert.match(text, /\| overlapped 7 \(test\.yml, push\) \|/);
});

test('idealBounds is empty without native runs', () => {
  assert.deepEqual(idealBounds([], [2]), []);
});

test('metricsOf refuses runs of another workflow, a re-run attempt, or retries', () => {
  const other = record();
  other.run.workflowPath = '.github/workflows/test.yml';
  assert.throws(() => metricsOf(other), /not mode native/);
  const rerun = record();
  rerun.run.attempt = 2;
  assert.throws(() => metricsOf(rerun), /only first attempts/);
  const retried = record();
  retried.shards[0].projects[1].retries = 1;
  assert.throws(() => metricsOf(retried), /retries/);
});

test('render refuses records from different suite versions', () => {
  const changed = record();
  changed.run.suiteFingerprint = 'tests@ffff playwright.config.ts@bbbb package-lock.json@cccc';
  assert.throws(() => render([record(), changed]), /2 suite versions/);
});

const SHA = 'abcdef0'.padEnd(40, '0');
const smart = (mode: string, action: Omit<NonNullable<RunRecord['action']>, 'sha'> | null) => {
  const r = record();
  r.mode = mode;
  r.run.workflowPath = '.github/workflows/smart.yml';
  r.action = action && { sha: SHA, ...action };
  return r;
};

test('armOf separates balanced, cold start and rollback runs', () => {
  assert.equal(armOf(record()), 'native');
  assert.equal(
    armOf(smart('smart', { mode: 'balanced', reason: 'history entry x' })),
    'smart @abcdef0',
  );
  assert.equal(
    armOf(smart('smart', { mode: 'native', reason: 'no history yet' })),
    'smart (cold start) @abcdef0',
  );
  assert.equal(
    armOf(smart('rollback', { mode: 'disabled', reason: 'off', coverage: 'not checked' })),
    'rollback @abcdef0',
  );
  assert.throws(
    () => armOf(smart('smart', { mode: 'balanced', reason: 'x', coverage: 'failed' })),
    /coverage failed/,
  );
  assert.throws(() => armOf(smart('rollback', { mode: 'balanced', reason: 'x' })), /not disabled/);
  assert.throws(() => armOf(smart('smart', { mode: 'native', reason: 'damaged' })), /damaged/);
  assert.throws(() => armOf(smart('smart', null)), /no Action decision/);
});

test('render compares each arm with native at the same shard count', () => {
  const balanced = smart('smart', { mode: 'balanced', reason: 'history entry x' });
  balanced.run.id = 43;
  balanced.shards[0].run.duration = 26_500;
  const text = render([record(), balanced]);
  assert.match(text, /\| smart @abcdef0 \| 2 \| 1 \| 26\.5 s \| -50% \|/);
});

test('executedTests rejects a dropped, a duplicated or a missing setup test', () => {
  assert.equal(executedTests(record()).size, 5);
  const dropped = record();
  dropped.shards[1].tests[1].attempts = [{ retry: 0, status: 'skipped', duration: 0 }];
  assert.throws(() => executedTests(dropped), /x0/);
  const duplicated = record();
  duplicated.shards[1].tests.push({ ...duplicated.shards[0].tests[1] });
  assert.throws(() => executedTests(duplicated), /x2/);
  const noSetup = record();
  noSetup.shards[1].tests = noSetup.shards[1].tests.filter((t) => t.project !== 'setup');
  assert.throws(() => executedTests(noSetup), /setup.*x1/);
});

test('render refuses runs that executed different test sets, and signs the change', () => {
  const other = record();
  other.run.id = 44;
  other.shards[1].tests[2].title = 'renamed';
  assert.throws(() => render([record(), other]), /different test set/);
  const slower = smart('smart', { mode: 'balanced', reason: 'history entry x' });
  slower.shards[0].run.duration = 60_000;
  assert.match(render([record(), slower]), /\| smart @abcdef0 \| 2 \| 1 \| 60\.0 s \| \+13% \|/);
});

test('metricsOf notes a slow shard start and a run off main, and checks the schema', () => {
  const slow = record();
  slow.jobs[2].startedAt = new Date(60_000).toISOString();
  slow.jobs[2].completedAt = new Date(100_000).toISOString();
  slow.run.overlappingRuns = [];
  slow.run.headBranch = 'results/smart';
  assert.equal(metricsOf(slow).notes, 'a shard waited 55 s to start; ran on results/smart');
  const old = record();
  old.schema = 1;
  assert.throws(() => metricsOf(old), /schema 1/);
});

test('render notes a single branch run in the summary', () => {
  const branch = smart('smart', {
    mode: 'balanced',
    reason: 'x',
    coverage: 'ok',
    history: 'unchanged',
  });
  branch.run.id = 45;
  branch.run.headBranch = 'results/smart';
  assert.match(
    render([record(), branch]),
    /\| 1 run, not a median; ran on results\/smart: read main’s history, published none/,
  );
});
