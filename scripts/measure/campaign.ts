/**
 * Dispatches measurement runs one at a time, waits for each to finish, and collects it into
 * results/raw/ before dispatching the next, so no two measured runs compete for runners. Usage:
 *
 *   node scripts/measure/campaign.ts --arms native:4,native:8,native:4,native:8 [--ref main]
 *
 * An arm is `<mode>:<shards>`; mode `native` dispatches .github/workflows/native.yml.
 */
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import { collect, writeRecord } from './collect.ts';

const REPO = 'muratkeremozcan/pw-parallel-test';
const WORKFLOWS: Record<string, string> = { native: 'native.yml' };
const POLL_MS = 30_000;
const FIND_TIMEOUT_MS = 5 * 60_000;
const RUN_TIMEOUT_MS = 60 * 60_000;

const gh = (args: string[]) => execFileSync('gh', args, { encoding: 'utf8' });

type Run = { databaseId: number; status: string; createdAt: string; event: string };

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
      'databaseId,status,createdAt,event',
    ]),
  ) as Run[];

/** Fails when any run of the measured workflows is still active, so a campaign starts alone. */
const assertIdle = () => {
  for (const workflow of Object.values(WORKFLOWS)) {
    const active = listRuns(workflow).filter((run) => run.status !== 'completed');
    if (active.length > 0) {
      throw new Error(`${workflow} has active runs: ${active.map((run) => run.databaseId)}`);
    }
  }
};

const dispatch = async (workflow: string, shards: number, ref: string): Promise<number> => {
  const known = new Set(listRuns(workflow).map((run) => run.databaseId));
  gh(['workflow', 'run', workflow, '--repo', REPO, '--ref', ref, '-f', `shards=${shards}`]);
  const deadline = Date.now() + FIND_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await delay(5_000);
    const fresh = listRuns(workflow).filter((run) => !known.has(run.databaseId));
    if (fresh.length === 1) return fresh[0].databaseId;
    if (fresh.length > 1) throw new Error(`more than one new ${workflow} run appeared`);
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
    assertIdle();
    const runId = await dispatch(WORKFLOWS[arm.mode], arm.shards, values.ref!);
    console.log(`[${index + 1}/${arms.length}] ${arm.mode}:${arm.shards} run ${runId} dispatched`);
    const conclusion = await waitFor(runId);
    if (conclusion !== 'success') throw new Error(`run ${runId} concluded ${conclusion}`);
    const file = writeRecord(collect(runId, arm.mode), values.out!);
    console.log(`[${index + 1}/${arms.length}] wrote ${file}`);
  }
};

await main();
