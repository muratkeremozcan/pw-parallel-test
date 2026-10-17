/**
 * Collects one finished GitHub Actions run into a raw JSON record under results/raw/: the run,
 * every job with its timestamps, and one reduced blob report per shard. render.ts reads only these
 * records. Usage:
 *
 *   node scripts/measure/collect.ts --run <run id> [--mode native|smart|rollback] [--out results/raw]
 *
 * Adapted from measurements/collect.js on the s6-candidates branch of
 * muratkeremozcan/playwright-smart-parallelization (MIT), trimmed to this repository.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { reduceBlob, type ShardReport } from './blob.ts';

export const SCHEMA = 2;
const REPO = 'muratkeremozcan/pw-parallel-test';
const MAX_BUFFER = 256 * 1024 * 1024;
const PAGE_SIZE = 100;

/**
 * The measured arms: the workflow each dispatches, the run name that identifies the arm and its
 * shard count, the dispatch inputs, and the name of a shard's blob report artifact with its shard
 * number. A run that matches none of them is rejected.
 */
export type Arm = {
  workflow: string;
  title: RegExp;
  inputs: Record<string, string>;
  blob: RegExp;
};
// 063aba8 named a shard's blob psp-blob-<key>-<run>-<shard>-attempt-<n>; 01187a8 names it
// blob-report-<key>-<shard>-attempt-<n>.
const SMART_BLOB = /^(?:psp-blob-[0-9a-f]{12}-\d+|blob-report-[0-9a-f]{12})-(\d+)-attempt-1$/;
export const ARMS: Record<string, Arm> = {
  native: {
    workflow: '.github/workflows/native.yml',
    title: /^Native shards (\d+)(?: |$)/,
    inputs: {},
    blob: /^blob-report-(\d+)$/,
  },
  smart: {
    workflow: '.github/workflows/smart.yml',
    title: /^Smart shards (\d+) enabled=true(?: |$)/,
    inputs: { enabled: 'true' },
    blob: SMART_BLOB,
  },
  rollback: {
    workflow: '.github/workflows/smart.yml',
    title: /^Smart shards (\d+) enabled=false(?: |$)/,
    inputs: { enabled: 'false' },
    blob: SMART_BLOB,
  },
};
/** The Action's decision line in the prepare job log. */
const ACTION_MODE = /mode (balanced|native|disabled) for all \d+ shards: (.*)$/m;
const ACTION_USES = /uses: muratkeremozcan\/playwright-smart-parallelization@([0-9a-f]{40})/g;

export type JobRecord = {
  id: number;
  name: string;
  conclusion: string | null;
  createdAt: string;
  startedAt: string;
  completedAt: string;
  runnerName: string | null;
  labels: string[];
};

export type RunRecord = {
  schema: number;
  repo: string;
  mode: string;
  run: {
    id: number;
    attempt: number;
    workflowPath: string;
    event: string;
    headBranch: string;
    headSha: string;
    suiteFingerprint: string;
    /** Other runs of the repository whose window overlapped this run's jobs, sharing runners. */
    overlappingRuns: { id: number; workflowPath: string; event: string }[];
    conclusion: string | null;
    createdAt: string;
    runStartedAt: string;
    updatedAt: string;
  };
  shardCount: number;
  /** The mode playwright-smart-parallelization chose in its prepare job; null for native.yml. */
  action: {
    /** The Action commit smart.yml pins at the run's commit. */
    sha: string;
    mode: string;
    reason: string;
    /** From the psp-decision artifact; absent for runs on Actions without these outputs. */
    coverage?: string;
    history?: string;
    overheadMs?: number | null;
  } | null;
  jobs: JobRecord[];
  shards: ShardReport[];
};

const gh = (args: string[]): Buffer => execFileSync('gh', args, { maxBuffer: MAX_BUFFER });
const ghJson = <T>(endpoint: string): T => JSON.parse(gh(['api', endpoint]).toString('utf8')) as T;

/** Every item of a paginated list endpoint; the count must match what the API reports. */
const paginate = <T>(endpoint: string, key: string, query = ''): T[] => {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const body = ghJson<Record<string, unknown>>(
      `${endpoint}?${query ? `${query}&` : ''}per_page=${PAGE_SIZE}&page=${page}`,
    );
    const batch = body[key] as T[];
    const total = body.total_count as number;
    items.push(...batch);
    if (batch.length === 0 || items.length >= total) {
      if (items.length !== total) {
        throw new Error(`${endpoint} listed ${items.length} ${key} but reports ${total}`);
      }
      return items;
    }
  }
};

/** Reads one file out of an artifact zip. */
const readArtifactFile = (artifactId: number, file: string): string => {
  const dir = mkdtempSync(join(tmpdir(), 'artifact-'));
  try {
    const zip = join(dir, 'artifact.zip');
    writeFileSync(zip, gh(['api', `repos/${REPO}/actions/artifacts/${artifactId}/zip`]));
    return execFileSync('unzip', ['-p', zip, file], { encoding: 'utf8', maxBuffer: MAX_BUFFER });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

/** Reads `report.jsonl` out of a blob artifact: a zip that holds one report zip per shard. */
const readBlobArtifact = (artifactId: number): string => {
  const dir = mkdtempSync(join(tmpdir(), 'blob-'));
  try {
    const outer = join(dir, 'artifact.zip');
    writeFileSync(outer, gh(['api', `repos/${REPO}/actions/artifacts/${artifactId}/zip`]));
    const members = execFileSync('unzip', ['-Z1', outer], { encoding: 'utf8' })
      .split('\n')
      .filter((name) => /^(?:.*\/)?report[^/]*\.zip$/.test(name));
    if (members.length !== 1) {
      throw new Error(`expected one report zip in artifact ${artifactId}, found ${members.length}`);
    }
    const inner = join(dir, 'report.zip');
    writeFileSync(
      inner,
      execFileSync('unzip', ['-p', outer, members[0]], { maxBuffer: MAX_BUFFER }),
    );
    return execFileSync('unzip', ['-p', inner, 'report.jsonl'], {
      encoding: 'utf8',
      maxBuffer: MAX_BUFFER,
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

/**
 * Identifies the suite a run executed: the git tree of tests/ and the blobs of the Playwright
 * config and the lockfile at the run's commit. Runs on different commits share a fingerprint when
 * those three are unchanged.
 */
const SUITE_PATHS = ['tests', 'playwright.config.ts', 'package-lock.json'];
const suiteFingerprint = (sha: string): string => {
  const commit = ghJson<{ tree: { sha: string } }>(`repos/${REPO}/git/commits/${sha}`);
  const tree = ghJson<{ tree: { path: string; sha: string }[]; truncated: boolean }>(
    `repos/${REPO}/git/trees/${commit.tree.sha}`,
  );
  if (tree.truncated) throw new Error(`the root tree of ${sha} is truncated`);
  return SUITE_PATHS.map((path) => {
    const entry = tree.tree.find((item) => item.path === path);
    if (!entry) throw new Error(`${path} is missing at ${sha}`);
    return `${path}@${entry.sha.slice(0, 12)}`;
  }).join(' ');
};

/** Runs of any workflow whose jobs overlap the window from this run's first job start to last end. */
const overlappingRuns = (runId: number, jobs: JobRecord[]): RunRecord['run']['overlappingRuns'] => {
  const start = Math.min(...jobs.map((job) => Date.parse(job.startedAt)));
  const end = Math.max(...jobs.map((job) => Date.parse(job.completedAt)));
  const since = new Date(start - 6 * 60 * 60 * 1000).toISOString();
  const candidates = paginate<Record<string, any>>(
    `repos/${REPO}/actions/runs`,
    'workflow_runs',
    `created=%3E%3D${since}`,
  ).filter((other) => other.id !== runId);
  return candidates
    .filter((other) => {
      const otherJobs = paginate<Record<string, any>>(
        `repos/${REPO}/actions/runs/${other.id}/jobs`,
        'jobs',
      ).filter((job) => job.started_at);
      // A job still running when this collects counts as running until now.
      return otherJobs.some(
        (job) =>
          Date.parse(job.started_at) < end &&
          (job.completed_at ? Date.parse(job.completed_at) : Date.now()) > start,
      );
    })
    .map((other) => ({ id: other.id, workflowPath: other.path, event: other.event }));
};

export const collect = (runId: number, mode: string): RunRecord => {
  const run = ghJson<Record<string, any>>(`repos/${REPO}/actions/runs/${runId}`);
  if (run.status !== 'completed') {
    throw new Error(`run ${runId} is ${run.status}; collect it after it completes`);
  }
  if (run.run_attempt !== 1) {
    throw new Error(`run ${runId} is attempt ${run.run_attempt}; only first attempts are measured`);
  }
  const arm = ARMS[mode];
  const title = arm ? arm.title.exec(run.display_title) : null;
  if (!arm || !title || run.path !== arm.workflow || run.event !== 'workflow_dispatch') {
    throw new Error(
      `run ${runId} (${run.event} of ${run.path}, "${run.display_title}") is not a dispatched run of mode ${mode}`,
    );
  }
  const shardCount = Number(title[1]);
  const jobs = paginate<Record<string, any>>(
    `repos/${REPO}/actions/runs/${runId}/jobs`,
    'jobs',
  ).map((job): JobRecord => ({
    id: job.id,
    name: job.name,
    conclusion: job.conclusion,
    createdAt: job.created_at,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    runnerName: job.runner_name,
    labels: job.labels,
  }));
  const allArtifacts = paginate<Record<string, any>>(
    `repos/${REPO}/actions/runs/${runId}/artifacts`,
    'artifacts',
  );
  const artifacts = allArtifacts
    .map((artifact) => ({ artifact, match: arm.blob.exec(artifact.name) }))
    .filter((entry) => entry.match)
    .map(({ artifact, match }) => ({ artifact, shard: Number(match![1]) }))
    .sort((a, b) => a.shard - b.shard);
  if (artifacts.some(({ artifact }) => artifact.expired)) {
    throw new Error(`run ${runId} has expired blob report artifacts`);
  }
  if (artifacts.length !== shardCount || artifacts.some(({ shard }, i) => shard !== i + 1)) {
    throw new Error(`run ${runId} holds blob reports that do not cover shards 1..${shardCount}`);
  }
  const shards = artifacts.map(({ artifact }) => reduceBlob(readBlobArtifact(artifact.id)));
  // Every arm runs Playwright with --shard=i/N, the Action included, so every blob carries it.
  shards.forEach((shard, i) => {
    if (shard.shard?.current !== i + 1 || shard.shard?.total !== shardCount) {
      throw new Error(
        `run ${runId} blob ${i + 1} says shard ${shard.shard?.current}/${shard.shard?.total}`,
      );
    }
  });

  let action: RunRecord['action'] = null;
  if (arm.workflow.endsWith('/smart.yml')) {
    const workflow = gh([
      'api',
      '-H',
      'Accept: application/vnd.github.raw',
      `repos/${REPO}/contents/${arm.workflow}?ref=${run.head_sha}`,
    ]).toString('utf8');
    const pins = [...workflow.matchAll(ACTION_USES)].map((match) => match[1]);
    if (pins.length === 0 || new Set(pins).size !== 1) {
      throw new Error(`run ${runId} smart.yml pins the Action ${pins.length} ways: ${pins}`);
    }
    const decision = allArtifacts.find((artifact) => artifact.name === 'psp-decision');
    if (decision) {
      const text = readArtifactFile(decision.id, 'decision.json');
      const parsed = JSON.parse(text) as Record<string, any>;
      action = {
        sha: pins[0],
        mode: parsed.mode,
        reason: parsed.reason,
        coverage: parsed.coverage,
        history: parsed.history,
        overheadMs: parsed.overheadMs,
      };
    } else {
      // Actions before 01187a8 had no mode output; their prepare log states it.
      const prepare = jobs.find((job) => job.name === 'Prepare');
      if (!prepare) throw new Error(`run ${runId} has no Prepare job`);
      const log = gh(['api', `repos/${REPO}/actions/jobs/${prepare.id}/logs`]).toString('utf8');
      const decided = ACTION_MODE.exec(log);
      if (!decided) throw new Error(`run ${runId} prepare log states no mode`);
      action = { sha: pins[0], mode: decided[1], reason: decided[2].trim() };
    }
  }

  return {
    schema: SCHEMA,
    repo: REPO,
    mode,
    run: {
      id: run.id,
      attempt: run.run_attempt,
      workflowPath: run.path,
      event: run.event,
      headBranch: run.head_branch,
      headSha: run.head_sha,
      suiteFingerprint: suiteFingerprint(run.head_sha),
      overlappingRuns: overlappingRuns(run.id, jobs),
      conclusion: run.conclusion,
      createdAt: run.created_at,
      runStartedAt: run.run_started_at,
      updatedAt: run.updated_at,
    },
    shardCount,
    action,
    jobs,
    shards,
  };
};

/** Writes a record as results/raw/<mode>-<shards>-<run id>.json and returns the path. */
export const writeRecord = (record: RunRecord, outDir: string): string => {
  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, `${record.mode}-${record.shardCount}-${record.run.id}.json`);
  writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
  return file;
};

const main = () => {
  const { values } = parseArgs({
    options: {
      run: { type: 'string' },
      mode: { type: 'string', default: 'native' },
      out: { type: 'string', default: 'results/raw' },
    },
  });
  const runId = Number(values.run);
  if (!Number.isInteger(runId) || runId <= 0) throw new Error('--run <run id> is required');
  console.log(`wrote ${writeRecord(collect(runId, values.mode!), values.out!)}`);
};

if (import.meta.main) main();
