/**
 * Dispatches measurement runs one at a time, waits for each to finish, and collects it into
 * results/raw/ before dispatching the next, so no two measured runs compete for runners. Usage:
 *
 *   node scripts/measure/campaign.ts --arms native:4,native:8,native:4,native:8 [--ref main]
 *
 * An arm is `<mode>:<shards>`; mode `native` dispatches .github/workflows/native.yml.
 */
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import { collect, WORKFLOWS, writeRecord } from './collect.ts';

const REPO = 'muratkeremozcan/pw-parallel-test';
const POLL_MS = 30_000;
const FIND_TIMEOUT_MS = 5 * 60_000;
const RUN_TIMEOUT_MS = 60 * 60_000;

const gh = (args: string[]) => execFileSync('gh', args, { encoding: 'utf8' });

type Run = { databaseId: number; status: string; displayTitle: string };

const listRuns = (workflow: string): Run[] =>
  JSON.parse(
    gh([
      'run',
      'list',
      '--repo',
      REPO,
      '--workflow',
      workflow,
      '--event',
      'workflow_dispatch',
      '--limit',
      '20',
      '--json',
      'databaseId,status,displayTitle',
    ]),
  ) as Run[];

/** Waits until no workflow run of the repository is active, so a measured run starts alone. */
const waitForIdle = async () => {
  const deadline = Date.now() + RUN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const active = ['queued', 'in_progress', 'waiting', 'pending', 'requested'].flatMap(
      (status) =>
        JSON.parse(
          gh([
            'run',
            'list',
            '--repo',
            REPO,
            '--status',
            status,
            '--json',
            'databaseId,workflowName',
          ]),
        ) as { databaseId: number; workflowName: string }[],
    );
    if (active.length === 0) return;
    console.log(
      `waiting for active runs: ${active.map((r) => `${r.workflowName} ${r.databaseId}`)}`,
    );
    await delay(POLL_MS);
  }
  throw new Error('the repository did not go idle');
};

/** Dispatches a run with a unique token in its run name and returns that run's id. */
const dispatch = async (workflow: string, shards: number, ref: string): Promise<number> => {
  const token = randomUUID();
  gh([
    'workflow',
    'run',
    workflow,
    '--repo',
    REPO,
    '--ref',
    ref,
    '-f',
    `shards=${shards}`,
    '-f',
    `token=${token}`,
  ]);
  const deadline = Date.now() + FIND_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await delay(5_000);
    const mine = listRuns(workflow).filter((run) => run.displayTitle.endsWith(` ${token}`));
    if (mine.length === 1) return mine[0].databaseId;
    if (mine.length > 1) throw new Error(`more than one ${workflow} run carries token ${token}`);
  }
  throw new Error(`no ${workflow} run appeared after dispatch`);
};

const waitFor = async (runId: number) => {
  const deadline = Date.now() + RUN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const run = JSON.parse(
      gh(['run', 'view', String(runId), '--repo', REPO, '--json', 'status,conclusion']),
    ) as { status: string; conclusion: string };
    if (run.status === 'completed') return run.conclusion;
    await delay(POLL_MS);
  }
  throw new Error(`run ${runId} did not finish within ${RUN_TIMEOUT_MS / 60_000} minutes`);
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      arms: { type: 'string' },
      ref: { type: 'string', default: 'main' },
      out: { type: 'string', default: 'results/raw' },
    },
  });
  const arms = (values.arms ?? '').split(',').map((arm) => {
    const [mode, count] = arm.split(':');
    const shards = Number(count);
    if (!WORKFLOWS[mode] || !Number.isInteger(shards) || shards < 1) {
      throw new Error(`bad arm ${JSON.stringify(arm)}; expected <mode>:<shards>`);
    }
    return { mode, shards };
  });
  if (arms.length === 0 || !values.arms) throw new Error('--arms is required');

  for (const [index, arm] of arms.entries()) {
    await waitForIdle();
    const runId = await dispatch(basename(WORKFLOWS[arm.mode]), arm.shards, values.ref!);
    console.log(`[${index + 1}/${arms.length}] ${arm.mode}:${arm.shards} run ${runId} dispatched`);
    const conclusion = await waitFor(runId);
    if (conclusion !== 'success') throw new Error(`run ${runId} concluded ${conclusion}`);
    const record = collect(runId, arm.mode);
    if (record.run.headBranch !== values.ref || record.shardCount !== arm.shards) {
      throw new Error(`run ${runId} ran ${record.run.headBranch} with ${record.shardCount} shards`);
    }
    const file = writeRecord(record, values.out!);
    console.log(`[${index + 1}/${arms.length}] wrote ${file}`);
  }
};

await main();
