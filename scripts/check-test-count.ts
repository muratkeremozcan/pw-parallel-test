/**
 * Fails unless a merged sharded run executed every test Playwright discovers exactly once, so a
 * shard that silently ran a subset, or two shards that overlap, cannot pass. A dependency project
 * such as `setup` runs once in every shard, so its tests must have run exactly once per shard.
 * Tests are compared by project, file and title path.
 *
 * Usage: node scripts/check-test-count.ts <merged-report.json> <shard count>
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import playwrightConfig from '../playwright.config.ts';

type Result = { status: string };
type Test = { projectName: string; results: Result[] };
type Spec = { title: string; file: string; tests: Test[] };
type Suite = { title: string; specs?: Spec[]; suites?: Suite[] };
type Report = { suites: Suite[] };

const [reportPath, shardArgument] = process.argv.slice(2);
const shards = Number(shardArgument);
if (!reportPath || !Number.isInteger(shards) || shards < 1) {
  throw new Error('usage: node scripts/check-test-count.ts <merged-report.json> <shard count>');
}

/** Maps each test key to its project and the number of executed results recorded for it. */
const collect = (report: Report) => {
  const keys = new Map<string, { project: string; runs: number }>();
  const walk = (suite: Suite, path: string[]) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        const key = [test.projectName, spec.file, ...path, spec.title].join(' › ');
        const runs = test.results.filter((result) => result.status !== 'skipped').length;
        const entry = keys.get(key) ?? { project: test.projectName, runs: 0 };
        keys.set(key, { ...entry, runs: entry.runs + runs });
      }
    }
    for (const child of suite.suites ?? []) walk(child, [...path, child.title]);
  };
  // The top-level suites are files; their titles are already in spec.file.
  for (const file of report.suites) walk(file, []);
  return keys;
};

const listed = collect(
  JSON.parse(
    execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json'], {
      encoding: 'utf8',
      env: { ...process.env, CI: '' },
    }),
  ) as Report,
);
const merged = collect(JSON.parse(readFileSync(reportPath, 'utf8')) as Report);
// The JSON reporter omits project dependencies, so they come from the config itself.
const dependencyProjects = new Set(
  (playwrightConfig.projects ?? []).flatMap((project) => project.dependencies ?? []),
);

const problems: string[] = [];
for (const [key, { project }] of listed) {
  const expected = dependencyProjects.has(project) ? shards : 1;
  const runs = merged.get(key)?.runs ?? 0;
  if (runs !== expected) problems.push(`ran ${runs} times, expected ${expected}: ${key}`);
}
for (const key of merged.keys()) {
  if (!listed.has(key)) problems.push(`not discovered: ${key}`);
}

console.log(`discovered ${listed.size} tests across ${shards} shards`);
for (const problem of problems) console.error(problem);
if (listed.size === 0 || problems.length > 0) {
  console.error('executed tests do not match the discovered tests');
  process.exit(1);
}
console.log('every discovered test ran the expected number of times');
