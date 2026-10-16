/**
 * Renders RESULTS.md from the raw run records in results/raw/. Every number in the output comes
 * from those records. Usage: node scripts/measure/render.ts [--raw results/raw] [--out RESULTS.md]
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { WORKFLOWS, type RunRecord } from './collect.ts';

const SHARD_JOB = /\b[Ss]hard (\d+)\/(\d+)\b/;

export type RunMetrics = {
  mode: string;
  shardCount: number;
  runId: number;
  headSha: string;
  playwrightVersion: string;
  workers: number;
  shardJobSeconds: number[];
  shardPlaywrightSeconds: number[];
  slowestJob: number;
  jobSpread: number;
  slowestPlaywright: number;
  playwrightSpread: number;
  completion: number;
  queueMax: number;
  machine: number;
  overlapping: string;
};

const seconds = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 1000;

export const median = (values: number[]): number => {
  if (values.length === 0) throw new Error('median of no values');
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const metricsOf = (record: RunRecord): RunMetrics => {
  if (
    record.run.workflowPath !== WORKFLOWS[record.mode] ||
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
  const jobSeconds = shardJobs.map(({ job }) => seconds(job.startedAt, job.completedAt));
  const playwrightSeconds = record.shards.map((shard) => shard.run.duration / 1000);
  const starts = record.jobs.map((job) => Date.parse(job.startedAt));
  const ends = record.jobs.map((job) => Date.parse(job.completedAt));
  return {
    mode: record.mode,
    shardCount: record.shardCount,
    runId: record.run.id,
    headSha: record.run.headSha,
    playwrightVersion: record.shards[0].playwrightVersion,
    workers: record.shards[0].workers,
    shardJobSeconds: jobSeconds,
    shardPlaywrightSeconds: playwrightSeconds,
    slowestJob: Math.max(...jobSeconds),
    jobSpread: Math.max(...jobSeconds) - Math.min(...jobSeconds),
    slowestPlaywright: Math.max(...playwrightSeconds),
    playwrightSpread: Math.max(...playwrightSeconds) - Math.min(...playwrightSeconds),
    completion: (Math.max(...ends) - Math.min(...starts)) / 1000,
    queueMax: Math.max(...shardJobs.map(({ job }) => seconds(job.createdAt, job.startedAt))),
    machine: jobSeconds.reduce((sum, value) => sum + value, 0),
    overlapping:
      record.run.overlappingRuns.length === 0
        ? 'none'
        : record.run.overlappingRuns
            .map((run) => `${run.id} (${run.workflowPath.split('/').pop()}, ${run.event})`)
            .join(', '),
  };
};

export type Bound = {
  shardCount: number;
  totalSeconds: number;
  longestUnitSeconds: number;
  longestUnit: string;
  setupSeconds: number;
  idealSeconds: number;
};

/**
 * The balanced lower bound for a shard's Playwright run time: every shard runs the setup
 * project, then at least an equal share of the remaining test time, and never less than the
 * longest indivisible unit. With fullyParallel off, a spec file is that unit. Each test's duration
 * is its median over every collected run.
 */
export const idealBounds = (records: RunRecord[], shardCounts: number[]): Bound[] => {
  const durations = new Map<string, { project: string; file: string; values: number[] }>();
  const dependencyProjects = new Set(
    records.flatMap((record) =>
      record.shards.flatMap((s) => s.projects.flatMap((p) => p.dependencies)),
    ),
  );
  for (const record of records) {
    for (const shard of record.shards) {
      for (const test of shard.tests) {
        const key = [
          test.project,
          test.file,
          ...test.titlePath,
          test.title,
          test.repeatEachIndex,
        ].join(' › ');
        const entry = durations.get(key) ?? { project: test.project, file: test.file, values: [] };
        entry.values.push(...test.attempts.map((attempt) => attempt.duration / 1000));
        durations.set(key, entry);
      }
    }
  }
  let setupSeconds = 0;
  const units = new Map<string, number>();
  for (const { project, file, values } of durations.values()) {
    const value = median(values);
    if (dependencyProjects.has(project)) setupSeconds += value;
    else units.set(`${project} › ${file}`, (units.get(`${project} › ${file}`) ?? 0) + value);
  }
  if (units.size === 0) return [];
  const total = [...units.values()].reduce((sum, value) => sum + value, 0);
  const [longestUnit, longestUnitSeconds] = [...units.entries()].sort((a, b) => b[1] - a[1])[0];
  return shardCounts.map((shardCount) => ({
    shardCount,
    totalSeconds: total,
    longestUnitSeconds,
    longestUnit,
    setupSeconds,
    idealSeconds: setupSeconds + Math.max(total / shardCount, longestUnitSeconds),
  }));
};

const s = (value: number) => `${value.toFixed(1)} s`;

export const render = (records: RunRecord[]): string => {
  const fingerprints = [...new Set(records.map((record) => record.run.suiteFingerprint))];
  if (fingerprints.length !== 1) {
    throw new Error(
      `records come from ${fingerprints.length} suite versions: ${fingerprints.join(' | ')}`,
    );
  }
  const metrics = records
    .map(metricsOf)
    .sort((a, b) => a.shardCount - b.shardCount || a.runId - b.runId);
  const groups = new Map<string, RunMetrics[]>();
  for (const m of metrics) {
    const key = `${m.mode}|${m.shardCount}`;
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }
  const shardCounts = [...new Set(metrics.map((m) => m.shardCount))].sort((a, b) => a - b);
  const bounds = idealBounds(
    records.filter((record) => record.mode === 'native'),
    shardCounts,
  );
  const versions = [...new Set(metrics.map((m) => m.playwrightVersion))].join(', ');
  const workers = [...new Set(metrics.map((m) => m.workers))].join(', ');
  const retries = [
    ...new Set(records.flatMap((r) => r.shards.flatMap((s) => s.projects.map((p) => p.retries)))),
  ].join(', ');

  const lines: string[] = [
    '# Results',
    '',
    '<!-- Generated by scripts/measure/render.ts from results/raw/. Do not edit by hand. -->',
    '',
    `Playwright ${versions}, ${workers} worker per shard, retries ${retries}, suite ` +
      `\`${fingerprints[0]}\`. \`fullyParallel\` is off in that \`playwright.config.ts\`. ` +
      `${metrics.length} ${metrics.length === 1 ? 'run' : 'runs'}. Times are seconds. Job times come from the GitHub Actions API, ` +
      'Playwright times from each shard’s blob report.',
    '',
    '## Summary',
    '',
    'Medians over the runs of each arm. The ideal bound is the balanced lower bound for the ' +
      'slowest shard’s Playwright time.',
    '',
    '| Arm | Shards | Runs | Slowest shard (Playwright) | Ideal bound | Spread (Playwright) | Slowest shard job | Spread (jobs) | Completion | Queue (max) | Machine time |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];
  for (const [key, runs] of groups) {
    const [mode, count] = key.split('|');
    const bound = bounds.find((b) => b.shardCount === Number(count));
    lines.push(
      `| ${mode} | ${count} | ${runs.length} | ${s(median(runs.map((r) => r.slowestPlaywright)))} | ` +
        `${bound ? s(bound.idealSeconds) : 'n/a'} | ${s(median(runs.map((r) => r.playwrightSpread)))} | ` +
        `${s(median(runs.map((r) => r.slowestJob)))} | ${s(median(runs.map((r) => r.jobSpread)))} | ` +
        `${s(median(runs.map((r) => r.completion)))} | ${s(median(runs.map((r) => r.queueMax)))} | ` +
        `${s(median(runs.map((r) => r.machine)))} |`,
    );
  }

  if (bounds.length > 0) {
    const b = bounds[0];
    lines.push(
      '',
      '## Ideal bound',
      '',
      `From the median duration of each test over the native runs: ${s(b.totalSeconds)} of test ` +
        `time outside the setup project, ${s(b.setupSeconds)} of setup that every shard runs, and ` +
        `a longest indivisible unit of ${s(b.longestUnitSeconds)} (\`${b.longestUnit}\`). ` +
        'The bound is setup + max(total / shards, longest unit).',
      '',
      '| Shards | Total / shards | Longest unit | Ideal bound |',
      '| ---: | ---: | ---: | ---: |',
      ...bounds.map(
        (bound) =>
          `| ${bound.shardCount} | ${s(bound.totalSeconds / bound.shardCount)} | ${s(bound.longestUnitSeconds)} | ${s(bound.idealSeconds)} |`,
      ),
    );
  }

  lines.push(
    '',
    '## Runs',
    '',
    'Completion runs from the first job start to the last job end. Queue is the longest wait of a ' +
      'shard job between creation and start. Machine time is the sum of the shard job durations. ' +
      'Overlapping runs are other runs of the repository whose jobs ran during this run, ' +
      'sharing the runner pool.',
    '',
    '| Arm | Shards | Run | Commit | Playwright per shard | Jobs per shard | Completion | Queue (max) | Machine time | Overlapping runs |',
    '| --- | ---: | --- | --- | --- | --- | ---: | ---: | ---: | --- |',
    ...metrics.map(
      (m) =>
        `| ${m.mode} | ${m.shardCount} | [${m.runId}](https://github.com/muratkeremozcan/pw-parallel-test/actions/runs/${m.runId}) | ` +
        `\`${m.headSha.slice(0, 7)}\` | ${m.shardPlaywrightSeconds.map((v) => v.toFixed(1)).join(' / ')} | ` +
        `${m.shardJobSeconds.map((v) => v.toFixed(0)).join(' / ')} | ${s(m.completion)} | ${s(m.queueMax)} | ${s(m.machine)} | ${m.overlapping} |`,
    ),
    '',
  );
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
