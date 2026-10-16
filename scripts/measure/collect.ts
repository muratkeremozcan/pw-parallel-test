/**
 * Collects one finished GitHub Actions run into a raw JSON record under results/raw/: the run,
 * every job with its timestamps, and one reduced blob report per shard. render.ts reads only these
 * records. Usage:
 *
 *   node scripts/measure/collect.ts --run <run id> [--mode native] [--out results/raw]
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

export const SCHEMA = 1;
const REPO = 'muratkeremozcan/pw-parallel-test';
const MAX_BUFFER = 256 * 1024 * 1024;
const PAGE_SIZE = 100;

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
    conclusion: string | null;
    createdAt: string;
    runStartedAt: string;
    updatedAt: string;
  };
  shardCount: number;
  jobs: JobRecord[];
  shards: ShardReport[];
};

const gh = (args: string[]): Buffer => execFileSync('gh', args, { maxBuffer: MAX_BUFFER });
const ghJson = <T>(endpoint: string): T => JSON.parse(gh(['api', endpoint]).toString('utf8')) as T;

/** Every item of a paginated list endpoint; the count must match what the API reports. */
const paginate = <T>(endpoint: string, key: string): T[] => {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const body = ghJson<Record<string, unknown>>(`${endpoint}?per_page=${PAGE_SIZE}&page=${page}`);
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

export const collect = (runId: number, mode: string): RunRecord => {
  const run = ghJson<Record<string, any>>(`repos/${REPO}/actions/runs/${runId}`);
  if (run.status !== 'completed') {
    throw new Error(`run ${runId} is ${run.status}; collect it after it completes`);
  }
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
  const artifacts = paginate<Record<string, any>>(
    `repos/${REPO}/actions/runs/${runId}/artifacts`,
    'artifacts',
  ).filter((artifact) => /^blob-report-\d+$/.test(artifact.name));
  if (artifacts.length === 0) throw new Error(`run ${runId} has no blob-report artifacts`);
  if (artifacts.some((artifact) => artifact.expired)) {
    throw new Error(`run ${runId} has expired blob-report artifacts`);
  }

  const shards = artifacts
    .map((artifact) => reduceBlob(readBlobArtifact(artifact.id)))
    .sort((a, b) => (a.shard?.current ?? 0) - (b.shard?.current ?? 0));
  const shardCount = shards[0].shard?.total ?? 1;
  if (shards.length !== shardCount || shards.some((shard, i) => shard.shard?.current !== i + 1)) {
    throw new Error(
      `run ${runId} holds blob reports for shards that do not cover 1..${shardCount}`,
    );
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
      conclusion: run.conclusion,
      createdAt: run.created_at,
      runStartedAt: run.run_started_at,
      updatedAt: run.updated_at,
    },
    shardCount,
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
