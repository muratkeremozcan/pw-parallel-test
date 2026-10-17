import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reduceBlob } from './blob.ts';
import type { JobRecord, RunRecord } from './collect.ts';
import {
  armOf,
  completionWithout,
  executedTests,
  fullyParallelOf,
  idealBounds,
  median,
  metricsOf,
  render,
} from './render.ts';

const line = (method: string, params: unknown) => JSON.stringify({ method, params });

/**
 * A blob report with a setup test and the given chromium tests, as `[file, ms, tags?]` entries,
 * from a config whose metadata says `fullyParallel`.
 */
const blob = (
  current: number,
  total: number,
  tests: [string, number, string[]?][],
  fullyParallel = false,
) => {
  const entry = (id: string, file: string, tags: string[] = []) => ({
    testId: id,
    title: id,
    location: { file },
    repeatEachIndex: 0,
    tags,
  });
  const lines = [
    line('onBlobReportMetadata', {
      userAgent: 'Playwright/1.64.1 node/24.1',
      shard: { current, total },
    }),
    line('onConfigure', {
      config: { version: '1.64.1', workers: 1, metadata: { fullyParallel } },
    }),
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
        suites: tests.map(([file, , tags], i) => ({
          title: file,
          entries: [entry(`t${current}-${i}`, file, tags)],
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
  const [two, four] = idealBounds(
    [record()],
    [
      { shardCount: 2, workers: 1, fullyParallel: false },
      { shardCount: 4, workers: 1, fullyParallel: false },
    ],
  );
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
  assert.match(text, /\| native \| 2 \| 1 \| no \| 1 \| 53\.0 s \| 0% \| 53\.0 s \| 30\.0 s \|/);
  assert.match(text, /actions\/runs\/42\)/);
  assert.match(
    text,
    /- native, 2 shards: \[42\]\(https:\/\/github\.com\/muratkeremozcan\/pw-parallel-test\/actions\/runs\/42\)/,
  );
  assert.match(text, /\| overlapped 7 \(test\.yml, push\) \|/);
  assert.match(text, /\| 1 run, not a median; 1 of 1 run overlapped another run \|/);
});

test('idealBounds divides the test time among every worker of every shard', () => {
  const [two] = idealBounds([record()], [{ shardCount: 1, workers: 2, fullyParallel: false }]);
  assert.equal(two.workers, 2);
  // 70 s over 2 workers is 35 s, below the 50 s file, so the file bounds it.
  assert.equal(two.idealSeconds, 53);
  assert.equal(
    idealBounds([record()], [{ shardCount: 1, workers: 1, fullyParallel: false }])[0].idealSeconds,
    73,
  );
});

test('render compares a multi-worker arm with native at the same workers only', () => {
  const two = record();
  two.run.id = 46;
  two.workersInput = 2;
  for (const shard of two.shards) shard.workers = 2;
  const text = render([record(), two]);
  assert.match(text, /\| native \| 2 \| 2 \| no \| 1 \| 53\.0 s \| 0% \|/);
  assert.match(text, /- native, 2 shards, 2 workers: \[46\]/);
  const wrong = record();
  wrong.workersInput = 4;
  assert.throws(() => metricsOf(wrong), /asked for 4 workers and ran 1/);
});

test('idealBounds is empty without native runs', () => {
  assert.deepEqual(idealBounds([], [{ shardCount: 2, workers: 1, fullyParallel: false }]), []);
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

test('render puts the newest suite first and an earlier suite under history', () => {
  const changed = record();
  changed.run.id = 99;
  changed.run.suiteFingerprint = 'tests@ffff playwright.config.ts@bbbb package-lock.json@cccc';
  const text = render([record(), changed]);
  const current = text.indexOf('## Current suite');
  const history = text.indexOf(
    '## History: suite `tests@aaaa playwright.config.ts@bbbb package-lock.json@cccc`',
  );
  assert.ok(current >= 0 && history > current);
  assert.ok(text.indexOf('actions/runs/99)') < history);
  assert.ok(text.indexOf('actions/runs/42)') > history);
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
  assert.match(text, /\| smart @abcdef0 \| 2 \| 1 \| no \| 1 \| 26\.5 s \| -50% \|/);
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
  assert.match(
    render([record(), slower]),
    /\| smart @abcdef0 \| 2 \| 1 \| no \| 1 \| 60\.0 s \| \+13% \|/,
  );
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

test('a rollback off main is noted without a history claim', () => {
  const rollback = smart('rollback', {
    mode: 'disabled',
    reason: 'off',
    coverage: 'not checked',
    history: 'unchanged',
  });
  rollback.run.headBranch = 'results/smart';
  assert.deepEqual(metricsOf(rollback).branchNotes, ['ran on results/smart']);
});

/** A schema 3 record: the 2-shard native fixture with fullyParallel set, and a serial pair. */
const current = (fullyParallel: boolean): RunRecord => {
  const r = record();
  r.schema = 3;
  r.fullyParallelInput = fullyParallel;
  for (const job of r.jobs) job.steps = [];
  r.shards = [
    reduceBlob(
      blob(
        1,
        2,
        [
          ['e2e/heavy.spec.ts', 40_000],
          ['e2e/heavy.spec.ts', 10_000],
        ],
        fullyParallel,
      ),
    ),
    reduceBlob(
      blob(
        2,
        2,
        [
          ['e2e/serial.spec.ts', 5000, ['@serial']],
          ['e2e/serial.spec.ts', 15_000, ['@serial']],
        ],
        fullyParallel,
      ),
    ),
  ];
  return r;
};

test('reduceBlob reads fullyParallel and tags, and refuses a config without it', () => {
  const shard = current(true).shards[1];
  assert.equal(shard.fullyParallel, true);
  assert.deepEqual(shard.tests[1].tags, ['@serial']);
  const text = blob(1, 1, [['e2e/a.spec.ts', 100]]).replace(
    '"metadata":{"fullyParallel":false}',
    '"metadata":{}',
  );
  assert.throws(() => reduceBlob(text), /lacks a boolean fullyParallel/);
});

test('fullyParallelOf reads schema 3 blobs, checks the input, and keeps schema 2 off', () => {
  assert.equal(fullyParallelOf(record()), false);
  assert.equal(fullyParallelOf(current(true)), true);
  assert.equal(fullyParallelOf(current(false)), false);
  const asked = current(true);
  asked.fullyParallelInput = false;
  assert.throws(() => fullyParallelOf(asked), /asked for fully-parallel false and ran true/);
  const mixed = current(true);
  mixed.shards[1].fullyParallel = false;
  assert.throws(() => fullyParallelOf(mixed), /disagree/);
});

test('idealBounds takes a test as the unit under fullyParallel, and a serial describe whole', () => {
  const layouts = [
    { shardCount: 2, workers: 2, fullyParallel: false },
    { shardCount: 2, workers: 2, fullyParallel: true },
  ];
  const [files, tests] = idealBounds([current(false)], layouts);
  assert.equal(files.longestUnit, 'chromium › e2e/heavy.spec.ts');
  assert.equal(files.longestUnitSeconds, 50);
  // Under fullyParallel the heavy file splits into its 40 s and 10 s tests; the serial pair stays
  // one 20 s unit, and the 40 s test bounds it.
  assert.equal(tests.longestUnit, 'chromium › e2e/heavy.spec.ts › t1-0 › 0');
  assert.equal(tests.longestUnitSeconds, 40);
  assert.equal(tests.idealSeconds, 43);
  const serial = current(false);
  serial.shards[0].tests.find((t) => t.title === 't1-0')!.attempts[0].duration = 1000;
  const [, bySerial] = idealBounds([serial], layouts);
  assert.equal(bySerial.longestUnit, 'chromium › e2e/serial.spec.ts');
  assert.equal(bySerial.longestUnitSeconds, 20);
});

test('render keeps fullyParallel arms apart and compares each with its own native', () => {
  const off = current(false);
  const on = current(true);
  on.run.id = 47;
  on.shards[0].run.duration = 26_500;
  const text = render([off, on]);
  assert.match(text, /\| native \| 2 \| 1 \| no \| 1 \| 53\.0 s \| 0% \|/);
  assert.match(text, /\| native \| 2 \| 1 \| yes \| 1 \| 26\.5 s \| 0% \|/);
  assert.match(text, /- native, 2 shards, fullyParallel: \[47\]/);
  assert.match(text, /\| 2 \| 1 \| yes \| 35\.0 s \| 40\.0 s \| 43\.0 s \|/);
});

test('completion leaves out the bookkeeping steps, and the finish step when asked', () => {
  const r = current(false);
  const at = (t: number) => new Date(t * 1000).toISOString();
  const step = (name: string, from: number, to: number) => ({
    name,
    conclusion: 'success',
    startedAt: at(from),
    completedAt: at(to),
  });
  for (const job of r.jobs) job.steps = [step('Set up job', 0, 0)];
  r.jobs[3].steps = [
    step('Merge blob reports', 75, 80),
    step('Run muratkeremozcan/playwright-smart-parallelization/finish@abc', 80, 86),
    step("Record the Action's decision", 86, 87),
    step("Upload the Action's decision", 87, 90),
  ];
  // The merge job ends at 90 s; the run starts at 1 s.
  assert.equal(
    completionWithout(r, () => false),
    89,
  );
  const m = metricsOf(r);
  assert.equal(m.completion, 85);
  assert.equal(m.completionWithoutFinish, 79);
  delete r.jobs[0].steps;
  assert.throws(() => metricsOf(r), /jobs without steps/);
  assert.equal(metricsOf(record()).completionWithoutFinish, null);
});
