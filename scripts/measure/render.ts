/**
 * Renders RESULTS.md from the raw run records in results/raw/. Every number in the output comes
 * from those records. Usage: node scripts/measure/render.ts [--raw results/raw] [--out RESULTS.md]
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { ARMS, SCHEMA, type RunRecord } from './collect.ts';

/** Record schemas render accepts. Schema 2 predates fullyParallel and tags in the record. */
const SCHEMAS = [2, SCHEMA];
/** The tag of a serial describe, which stays one indivisible unit under fullyParallel. */
const SERIAL_TAG = '@serial';

const SHARD_JOB = /\b[Ss]hard (\d+)\/(\d+)\b/;

export type RunMetrics = {
  arm: string;
  shardCount: number;
  runId: number;
  headSha: string;
  playwrightVersion: string;
  workers: number;
  fullyParallel: boolean;
  shardJobSeconds: number[];
  shardPlaywrightSeconds: number[];
  slowestJob: number;
  jobSpread: number;
  slowestPlaywright: number;
  playwrightSpread: number;
  /** First job start to last job end, without the benchmark's bookkeeping steps. */
  completion: number;
  /** The same without the Action's optional finish step as well; null without step timings. */
  completionWithoutFinish: number | null;
  queueMax: number;
  machine: number;
  notes: string;
  branchNotes: string[];
  overlapped: boolean;
};

const seconds = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 1000;

export const median = (values: number[]): number => {
  if (values.length === 0) throw new Error('median of no values');
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Arms in the order the summary lists them. */
const ARM_ORDER = ['native', 'smart (cold start)', 'smart', 'rollback'];
/** Orders arms by kind, then by the first run of each, so older Action pins list first. */
const armRank = (arm: string) => ARM_ORDER.indexOf(arm.replace(/ @[0-9a-f]{7}$/, ''));

/**
 * The arm a run counts toward, labelled with the Action commit for smart.yml runs. A smart run is
 * `smart` only when the Action balanced it; with no history it ran native sharding and counts as
 * the cold start. The rollback must have run disabled. Where the Action reported its own coverage
 * check, a balanced or cold run must say ok and the rollback not checked.
 */
export const armOf = (record: RunRecord): string => {
  if (record.mode === 'native') return 'native';
  const decided = record.action;
  if (!decided) throw new Error(`run ${record.run.id} has no Action decision`);
  const at = ` @${decided.sha.slice(0, 7)}`;
  const expectCoverage = (expected: string) => {
    if (decided.coverage !== undefined && decided.coverage !== expected) {
      throw new Error(`run ${record.run.id}: the Action reported coverage ${decided.coverage}`);
    }
  };
  if (record.mode === 'rollback') {
    if (decided.mode !== 'disabled') {
      throw new Error(`rollback run ${record.run.id} ran ${decided.mode}, not disabled`);
    }
    expectCoverage('not checked');
    return `rollback${at}`;
  }
  expectCoverage('ok');
  if (decided.mode === 'balanced') return `smart${at}`;
  if (decided.mode === 'native' && decided.reason === 'no history yet') {
    return `smart (cold start)${at}`;
  }
  throw new Error(`smart run ${record.run.id} ran ${decided.mode}: ${decided.reason}`);
};

const testKey = (test: RunRecord['shards'][number]['tests'][number]) =>
  [test.project, test.file, ...test.titlePath, test.title, test.repeatEachIndex].join(' › ');

/**
 * The tests a run executed, checked the way check-test-count.ts checks a native run: every test
 * ran exactly once across the shards, and each test of a dependency project once in every shard.
 * The Action's own check is part of what is measured, and its rollback mode checks only exit codes.
 */
export const executedTests = (record: RunRecord): Set<string> => {
  const dependencies = new Set(
    record.shards.flatMap((shard) => shard.projects.flatMap((p) => p.dependencies)),
  );
  const runs = new Map<string, { project: string; count: number }>();
  for (const shard of record.shards) {
    for (const test of shard.tests) {
      const executed = test.attempts.filter((a) => a.status !== 'skipped').length;
      const key = testKey(test);
      const entry = runs.get(key) ?? { project: test.project, count: 0 };
      runs.set(key, { ...entry, count: entry.count + executed });
    }
  }
  const wrong = [...runs].filter(
    ([, { project, count }]) => count !== (dependencies.has(project) ? record.shardCount : 1),
  );
  if (wrong.length > 0) {
    throw new Error(
      `run ${record.run.id} ran tests the wrong number of times: ` +
        wrong.map(([key, { count }]) => `${key} x${count}`).join(', '),
    );
  }
  return new Set(runs.keys());
};

/**
 * Whether a run had fullyParallel on, from the config metadata in every shard's blob report, which
 * must agree with each other and with the dispatch input. Schema 2 records predate that metadata;
 * the config of their suite left fullyParallel off, and their workflows had no such input.
 */
export const fullyParallelOf = (record: RunRecord): boolean => {
  if (record.schema === 2) return false;
  const values = new Set(record.shards.map((shard) => shard.fullyParallel));
  if (values.size !== 1 || ![...values].every((value) => typeof value === 'boolean')) {
    throw new Error(`run ${record.run.id} shards disagree on fullyParallel: ${[...values]}`);
  }
  const [value] = values as Set<boolean>;
  if (record.fullyParallelInput !== value) {
    throw new Error(
      `run ${record.run.id} asked for fully-parallel ${record.fullyParallelInput} and ran ${value}`,
    );
  }
  return value;
};

/**
 * Steps of smart.yml that only keep the Action's outputs for this benchmark. A user's workflow has
 * none, so completion leaves them out.
 */
const BOOKKEEPING_STEPS = new Set(["Record the Action's decision", "Upload the Action's decision"]);
/** The Action's optional finish step, which native sharding has no counterpart of. */
const FINISH_STEP = /playwright-smart-parallelization\/finish@/;

/**
 * First job start to last job end, with the time of the dropped steps taken out of the job that
 * ran them, as if they had taken no time. Schema 2 records keep no steps, so their jobs count
 * whole.
 */
export const completionWithout = (record: RunRecord, drop: (step: string) => boolean): number => {
  const start = Math.min(...record.jobs.map((job) => Date.parse(job.startedAt)));
  const ends = record.jobs.map((job) => {
    if (!job.steps) return record.schema === 2 ? Date.parse(job.completedAt) : NaN;
    const dropped = job.steps
      .filter((step) => drop(step.name) && step.startedAt && step.completedAt)
      .reduce((sum, step) => sum + Date.parse(step.completedAt!) - Date.parse(step.startedAt!), 0);
    return Date.parse(job.completedAt) - dropped;
  });
  if (ends.some(Number.isNaN)) throw new Error(`run ${record.run.id} has jobs without steps`);
  return (Math.max(...ends) - start) / 1000;
};

/** A shard job that waited longer than this to start is called out in the run's notes. */
const SLOW_START_SECONDS = 30;

export const metricsOf = (record: RunRecord): RunMetrics => {
  if (!SCHEMAS.includes(record.schema)) {
    throw new Error(
      `run ${record.run.id} has record schema ${record.schema}, expected one of ${SCHEMAS}`,
    );
  }
  if (
    !ARMS[record.mode] ||
    record.run.workflowPath !== ARMS[record.mode].workflow ||
    record.run.event !== 'workflow_dispatch'
  ) {
    throw new Error(
      `run ${record.run.id} is a ${record.run.event} run of ${record.run.workflowPath}, not mode ${record.mode}`,
    );
  }
  if (record.run.attempt !== 1) {
    throw new Error(
      `run ${record.run.id} is attempt ${record.run.attempt}; only first attempts count`,
    );
  }
  const retried = record.shards.flatMap((shard) => shard.projects).filter((p) => p.retries !== 0);
  if (retried.length > 0) {
    throw new Error(
      `run ${record.run.id} has projects with retries: ${retried.map((p) => p.name)}`,
    );
  }
  const shardJobs = record.jobs
    .map((job) => ({ job, match: SHARD_JOB.exec(job.name) }))
    .filter((entry) => entry.match)
    .sort((a, b) => Number(a.match![1]) - Number(b.match![1]));
  if (shardJobs.length !== record.shardCount) {
    throw new Error(
      `run ${record.run.id} has ${shardJobs.length} shard jobs for ${record.shardCount} shards`,
    );
  }
  const failed = record.jobs.filter((job) => job.conclusion !== 'success');
  if (failed.length > 0) {
    throw new Error(
      `run ${record.run.id} has jobs that did not succeed: ${failed.map((j) => j.name)}`,
    );
  }
  const workers = record.shards[0].workers;
  if (record.shards.some((shard) => shard.workers !== workers)) {
    throw new Error(`run ${record.run.id} ran its shards with different worker counts`);
  }
  if (record.workersInput && record.workersInput !== workers) {
    throw new Error(
      `run ${record.run.id} asked for ${record.workersInput} workers and ran ${workers}`,
    );
  }
  const fullyParallel = fullyParallelOf(record);
  const jobSeconds = shardJobs.map(({ job }) => seconds(job.startedAt, job.completedAt));
  const playwrightSeconds = record.shards.map((shard) => shard.run.duration / 1000);
  const queueMax = Math.max(...shardJobs.map(({ job }) => seconds(job.createdAt, job.startedAt)));
  return {
    arm: armOf(record),
    shardCount: record.shardCount,
    runId: record.run.id,
    headSha: record.run.headSha,
    playwrightVersion: record.shards[0].playwrightVersion,
    workers,
    fullyParallel,
    shardJobSeconds: jobSeconds,
    shardPlaywrightSeconds: playwrightSeconds,
    slowestJob: Math.max(...jobSeconds),
    jobSpread: Math.max(...jobSeconds) - Math.min(...jobSeconds),
    slowestPlaywright: Math.max(...playwrightSeconds),
    playwrightSpread: Math.max(...playwrightSeconds) - Math.min(...playwrightSeconds),
    completion: completionWithout(record, (step) => BOOKKEEPING_STEPS.has(step)),
    completionWithoutFinish:
      record.schema === 2
        ? null
        : completionWithout(
            record,
            (step) => BOOKKEEPING_STEPS.has(step) || FINISH_STEP.test(step),
          ),
    queueMax,
    machine: jobSeconds.reduce((sum, value) => sum + value, 0),
    overlapped: record.run.overlappingRuns.length > 0,
    branchNotes:
      record.run.headBranch === 'main'
        ? []
        : [
            `ran on ${record.run.headBranch}` +
              (record.action?.mode !== 'disabled' && record.action?.history === 'unchanged'
                ? ': read main’s history, published none, so its finish skipped the history write'
                : ''),
          ],
    notes:
      [
        ...record.run.overlappingRuns.map(
          (run) => `overlapped ${run.id} (${run.workflowPath.split('/').pop()}, ${run.event})`,
        ),
        ...(queueMax > SLOW_START_SECONDS
          ? [`a shard waited ${queueMax.toFixed(0)} s to start`]
          : []),
        ...(record.run.headBranch !== 'main' ? [`ran on ${record.run.headBranch}`] : []),
      ].join('; ') || 'none',
  };
};

/** A layout the ideal bound is computed for: shards, workers per shard, and fullyParallel. */
export type Layout = { shardCount: number; workers: number; fullyParallel: boolean };

export type Bound = Layout & {
  totalSeconds: number;
  longestUnitSeconds: number;
  longestUnit: string;
  setupSeconds: number;
  idealSeconds: number;
};

/**
 * The indivisible unit a test belongs to. With fullyParallel off a spec file is that unit. With it
 * on each test is its own unit, except the tests of a serial describe, which Playwright keeps
 * together; those carry the @serial tag.
 */
const unitOf = (test: RunRecord['shards'][number]['tests'][number], fullyParallel: boolean) => {
  if (!fullyParallel) return `${test.project} › ${test.file}`;
  if (test.tags?.includes(SERIAL_TAG)) {
    return [test.project, test.file, ...test.titlePath].join(' › ');
  }
  return [test.project, test.file, ...test.titlePath, test.title, test.repeatEachIndex].join(' › ');
};

/**
 * The balanced lower bound for a shard's Playwright run time: every shard runs the setup
 * project, then its workers share at least an equal part of the remaining test time, and never
 * less than the longest indivisible unit. Each test's duration is its median over every collected
 * run.
 */
export const idealBounds = (records: RunRecord[], layouts: Layout[]): Bound[] => {
  const durations = new Map<
    string,
    { test: RunRecord['shards'][number]['tests'][number]; values: number[] }
  >();
  const dependencyProjects = new Set(
    records.flatMap((record) =>
      record.shards.flatMap((s) => s.projects.flatMap((p) => p.dependencies)),
    ),
  );
  for (const record of records) {
    for (const shard of record.shards) {
      for (const test of shard.tests) {
        const key = testKey(test);
        const entry = durations.get(key) ?? { test, values: [] };
        entry.values.push(...test.attempts.map((attempt) => attempt.duration / 1000));
        durations.set(key, entry);
      }
    }
  }
  if (durations.size === 0) return [];
  let setupSeconds = 0;
  const tests: { test: RunRecord['shards'][number]['tests'][number]; seconds: number }[] = [];
  for (const { test, values } of durations.values()) {
    if (dependencyProjects.has(test.project)) setupSeconds += median(values);
    else tests.push({ test, seconds: median(values) });
  }
  if (tests.length === 0) return [];
  const total = tests.reduce((sum, { seconds }) => sum + seconds, 0);
  const longest = (fullyParallel: boolean) => {
    const units = new Map<string, number>();
    for (const { test, seconds } of tests) {
      const unit = unitOf(test, fullyParallel);
      units.set(unit, (units.get(unit) ?? 0) + seconds);
    }
    return [...units.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  };
  return layouts.map((layout) => {
    const [longestUnit, longestUnitSeconds] = longest(layout.fullyParallel);
    return {
      ...layout,
      totalSeconds: total,
      longestUnitSeconds,
      longestUnit,
      setupSeconds,
      idealSeconds:
        setupSeconds + Math.max(total / (layout.shardCount * layout.workers), longestUnitSeconds),
    };
  });
};

const s = (value: number) => `${value.toFixed(1)} s`;
const yesNo = (value: boolean) => (value ? 'yes' : 'no');
const runUrl = (id: number) =>
  `https://github.com/muratkeremozcan/pw-parallel-test/actions/runs/${id}`;

/** The run-name style label of a layout, for run links. */
const layoutLabel = (shardCount: number, workers: number, fullyParallel: boolean) =>
  `${shardCount} shards` +
  (workers === 1 ? '' : `, ${workers} workers`) +
  (fullyParallel ? ', fullyParallel' : '');

/** One suite's sections: summary, run links, ideal bound and runs, under headings of `level`. */
const renderSuite = (records: RunRecord[], level: string): string[] => {
  const testSets = records.map((record) => ({ id: record.run.id, tests: executedTests(record) }));
  const reference = testSets[0];
  for (const { id, tests } of testSets) {
    const same =
      tests.size === reference.tests.size && [...tests].every((key) => reference.tests.has(key));
    if (!same) throw new Error(`run ${id} executed a different test set than run ${reference.id}`);
  }
  const metrics = records
    .map(metricsOf)
    .sort(
      (a, b) =>
        Number(a.fullyParallel) - Number(b.fullyParallel) ||
        a.shardCount - b.shardCount ||
        a.workers - b.workers ||
        a.runId - b.runId,
    );
  const groupKey = (m: { fullyParallel: boolean; shardCount: number; workers: number }) =>
    `${m.fullyParallel}|${m.shardCount}|${m.workers}`;
  const groups = new Map<string, RunMetrics[]>();
  for (const m of metrics) {
    const key = `${m.arm}|${groupKey(m)}`;
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }
  const ordered = [...groups.values()].sort((a, b) => {
    const [x, y] = [a[0], b[0]];
    return (
      Number(x.fullyParallel) - Number(y.fullyParallel) ||
      x.shardCount - y.shardCount ||
      x.workers - y.workers ||
      armRank(x.arm) - armRank(y.arm) ||
      Math.min(...a.map((r) => r.runId)) - Math.min(...b.map((r) => r.runId))
    );
  });
  const nativeMedian = (like: RunMetrics, pick: (m: RunMetrics) => number) => {
    const runs = groups.get(`native|${groupKey(like)}`);
    return runs ? median(runs.map(pick)) : null;
  };
  /** What a reader must know before comparing an arm's medians: run count, branch, history. */
  const overlapNote = (runs: RunMetrics[]) => {
    const overlapped = runs.filter((r) => r.overlapped).length;
    if (overlapped === 0) return [];
    return [
      `${overlapped} of ${runs.length} ${runs.length === 1 ? 'run' : 'runs'} overlapped another run`,
    ];
  };
  const armNotes = (runs: RunMetrics[]) => {
    const notes = [
      ...(runs.length === 1 ? ['1 run, not a median'] : []),
      ...[...new Set(runs.flatMap((r) => r.branchNotes))],
      ...overlapNote(runs),
    ];
    return notes.join('; ') || 'none';
  };
  const versus = (value: number, base: number | null) => {
    if (base === null) return 'n/a';
    const percent = Math.round(((value - base) / base) * 100) || 0;
    return `${percent > 0 ? '+' : ''}${percent}%`;
  };
  const layouts: Layout[] = [...new Map(metrics.map((m) => [groupKey(m), m])).values()].map(
    ({ shardCount, workers, fullyParallel }) => ({ shardCount, workers, fullyParallel }),
  );
  const bounds = idealBounds(
    records.filter((record) => record.mode === 'native'),
    layouts,
  );
  const boundOf = (like: RunMetrics) => bounds.find((b) => groupKey(b) === groupKey(like));
  const versions = [...new Set(metrics.map((m) => m.playwrightVersion))].join(', ');
  const workers = [...new Set(metrics.map((m) => m.workers))].sort((a, b) => a - b).join(', ');
  const retries = [
    ...new Set(records.flatMap((r) => r.shards.flatMap((s) => s.projects.map((p) => p.retries)))),
  ].join(', ');
  const legacy = records.every((record) => record.schema === 2);

  const lines: string[] = [
    `Playwright ${versions}, ${workers} ${workers === '1' ? 'worker' : 'workers'} per shard as the Workers column shows, retries ${retries}, suite ` +
      `\`${records[0].run.suiteFingerprint}\`. ` +
      (legacy
        ? '`fullyParallel` is off in that `playwright.config.ts`. '
        : '`fullyParallel` as the Fully parallel column shows, read from the config metadata in each shard’s blob report. ') +
      `${metrics.length} ${metrics.length === 1 ? 'run' : 'runs'}. Times are seconds. Job times come from the GitHub Actions API, ` +
      'Playwright times from each shard’s blob report.',
    '',
    `${level} Summary`,
    '',
    'Medians over the runs of each arm. The ideal bound is the balanced lower bound for the ' +
      'slowest shard’s Playwright time. "vs native" compares a median with the native median at ' +
      'the same shard count, workers and fullyParallel. `smart` runs are the ones the Action balanced from its history; the ' +
      'cold start is the first smart run, which had no history and ran native sharding; ' +
      '`rollback` ran the smart workflow with `enabled: false`. `@sha` is the Action commit. ' +
      'Completion and "without finish" are defined under Runs; native has no finish step, so its ' +
      'two completions match.',
    '',
    '| Arm | Shards | Workers | Fully parallel | Runs | Slowest shard (Playwright) | vs native | Ideal bound | Spread (Playwright) | Slowest shard job | Spread (jobs) | Completion | vs native | Completion without finish | vs native | Queue (max) | Machine time | Notes |',
    '| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  ];
  for (const runs of ordered) {
    const { arm, shardCount, workers: perShard, fullyParallel } = runs[0];
    const bound = boundOf(runs[0]);
    const slowest = median(runs.map((r) => r.slowestPlaywright));
    const completion = median(runs.map((r) => r.completion));
    const withoutFinish = runs.every((r) => r.completionWithoutFinish !== null)
      ? median(runs.map((r) => r.completionWithoutFinish!))
      : null;
    const nativeWithoutFinish = nativeMedian(runs[0], (r) => r.completionWithoutFinish ?? NaN);
    lines.push(
      `| ${arm} | ${shardCount} | ${perShard} | ${yesNo(fullyParallel)} | ${runs.length} | ${s(slowest)} | ` +
        `${versus(
          slowest,
          nativeMedian(runs[0], (r) => r.slowestPlaywright),
        )} | ` +
        `${bound ? s(bound.idealSeconds) : 'n/a'} | ${s(median(runs.map((r) => r.playwrightSpread)))} | ` +
        `${s(median(runs.map((r) => r.slowestJob)))} | ${s(median(runs.map((r) => r.jobSpread)))} | ` +
        `${s(completion)} | ${versus(
          completion,
          nativeMedian(runs[0], (r) => r.completion),
        )} | ` +
        `${withoutFinish === null ? 'n/a' : s(withoutFinish)} | ${
          withoutFinish === null ||
          nativeWithoutFinish === null ||
          Number.isNaN(nativeWithoutFinish)
            ? 'n/a'
            : versus(withoutFinish, nativeWithoutFinish)
        } | ` +
        `${s(median(runs.map((r) => r.queueMax)))} | ${s(median(runs.map((r) => r.machine)))} | ` +
        `${armNotes(runs)} |`,
    );
  }

  lines.push(
    '',
    `${level} Run links`,
    '',
    'Every run the summary counts, by arm, shard count, workers per shard and fullyParallel.',
    '',
    ...ordered.map((runs) => {
      const { arm, shardCount, workers: perShard, fullyParallel } = runs[0];
      const links = runs.map((r) => `[${r.runId}](${runUrl(r.runId)})`).join(', ');
      return `- ${arm}, ${layoutLabel(shardCount, perShard, fullyParallel)}: ${links}`;
    }),
  );

  if (bounds.length > 0) {
    const b = bounds[0];
    const units = [...new Map(bounds.map((bound) => [bound.fullyParallel, bound])).values()];
    lines.push(
      '',
      `${level} Ideal bound`,
      '',
      `From the median duration of each test over the native runs: ${s(b.totalSeconds)} of test ` +
        `time outside the setup project and ${s(b.setupSeconds)} of setup that every shard runs. ` +
        units
          .map((bound) =>
            bound.fullyParallel
              ? `With fullyParallel on, a test or a serial describe is indivisible, and the longest is ${s(bound.longestUnitSeconds)} (\`${bound.longestUnit}\`). `
              : `With fullyParallel off, a spec file is indivisible, and the longest is ${s(bound.longestUnitSeconds)} (\`${bound.longestUnit}\`). `,
          )
          .join('') +
        'The bound is setup + max(total / (shards × workers), longest unit).',
      '',
      '| Shards | Workers | Fully parallel | Total / (shards × workers) | Longest unit | Ideal bound |',
      '| ---: | ---: | --- | ---: | ---: | ---: |',
      ...bounds.map(
        (bound) =>
          `| ${bound.shardCount} | ${bound.workers} | ${yesNo(bound.fullyParallel)} | ${s(bound.totalSeconds / (bound.shardCount * bound.workers))} | ${s(bound.longestUnitSeconds)} | ${s(bound.idealSeconds)} |`,
      ),
    );
  }

  lines.push(
    '',
    `${level} Runs`,
    '',
    'Completion runs from the first job start to the last job end. From schema 3 it leaves out ' +
      'the two steps of smart.yml that keep the Action’s outputs for this benchmark, and ' +
      '"without finish" also leaves out the Action’s optional finish step. Queue is the longest wait of a ' +
      'shard job between creation and start. Machine time is the sum of the shard job durations. ' +
      'Notes name other runs of the repository whose jobs ran during this run and shared the ' +
      `runner pool, a shard job that waited more than ${SLOW_START_SECONDS} s to start, and a run ` +
      'dispatched from a branch other than main.',
    '',
    '| Arm | Shards | Workers | Fully parallel | Run | Commit | Playwright per shard | Jobs per shard | Completion | Completion without finish | Queue (max) | Machine time | Notes |',
    '| --- | ---: | ---: | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |',
    ...metrics.map(
      (m) =>
        `| ${m.arm} | ${m.shardCount} | ${m.workers} | ${yesNo(m.fullyParallel)} | [${m.runId}](${runUrl(m.runId)}) | ` +
        `\`${m.headSha.slice(0, 7)}\` | ${m.shardPlaywrightSeconds.map((v) => v.toFixed(1)).join(' / ')} | ` +
        `${m.shardJobSeconds.map((v) => v.toFixed(0)).join(' / ')} | ${s(m.completion)} | ${m.completionWithoutFinish === null ? 'n/a' : s(m.completionWithoutFinish)} | ${s(m.queueMax)} | ${s(m.machine)} | ${m.notes} |`,
    ),
  );
  return lines;
};

/**
 * RESULTS.md: the suite of the newest run first, then every earlier suite as history, newest
 * first. A suite is one fingerprint; numbers are never compared across suites.
 */
export const render = (records: RunRecord[]): string => {
  const suites = new Map<string, RunRecord[]>();
  for (const record of records) {
    const fingerprint = record.run.suiteFingerprint;
    suites.set(fingerprint, [...(suites.get(fingerprint) ?? []), record]);
  }
  const newest = (runs: RunRecord[]) => Math.max(...runs.map((r) => r.run.id));
  const [current, ...history] = [...suites.values()].sort((a, b) => newest(b) - newest(a));
  const lines: string[] = [
    '# Results',
    '',
    '<!-- Generated by scripts/measure/render.ts from results/raw/. Do not edit by hand. -->',
    '',
    ...(history.length === 0
      ? []
      : [
          `The current suite comes first. ${history.length === 1 ? 'An earlier suite follows' : `${history.length} earlier suites follow`} ` +
            'as history; numbers compare only within a suite. See results/README.md for why each suite changed.',
          '',
        ]),
    '## Current suite',
    '',
    ...renderSuite(current, '###'),
  ];
  for (const runs of history) {
    lines.push(
      '',
      `## History: suite \`${runs[0].run.suiteFingerprint}\``,
      '',
      ...renderSuite(runs, '###'),
    );
  }
  lines.push('');
  return lines.join('\n');
};

const main = () => {
  const { values } = parseArgs({
    options: {
      raw: { type: 'string', default: 'results/raw' },
      out: { type: 'string', default: 'RESULTS.md' },
    },
  });
  const files = readdirSync(values.raw!)
    .filter((file) => file.endsWith('.json'))
    .sort();
  if (files.length === 0) throw new Error(`no run records in ${values.raw}`);
  const records = files.map(
    (file) => JSON.parse(readFileSync(join(values.raw!, file), 'utf8')) as RunRecord,
  );
  writeFileSync(values.out!, render(records));
  console.log(`rendered ${records.length} runs into ${values.out}`);
};

if (import.meta.main) main();
