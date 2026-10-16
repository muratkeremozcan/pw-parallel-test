/**
 * Fails when a merged run did not execute every test Playwright discovers, so a shard that
 * silently ran a subset cannot pass. Tests are compared by project, file and title path, because a
 * dependency project such as `setup` runs once in every shard and appears once per shard in the
 * merged report. Usage: node scripts/check-test-count.ts <merged-report.json>
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

type Result = { status: string };
type Test = { projectName: string; results: Result[] };
type Spec = { title: string; file: string; tests: Test[] };
type Suite = { title: string; specs?: Spec[]; suites?: Suite[] };
type Report = { suites: Suite[] };

const reportPath = process.argv[2];
if (!reportPath) {
  throw new Error('usage: node scripts/check-test-count.ts <merged-report.json>');
}

/** Maps each test key to the number of results recorded for it. */
const collect = (report: Report): Map<string, number> => {
  const keys = new Map<string, number>();
  const walk = (suite: Suite, path: string[]) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        const key = [test.projectName, spec.file, ...path, spec.title].join(' › ');
        const ran = test.results.filter((result) => result.status !== 'skipped').length;
        keys.set(key, (keys.get(key) ?? 0) + ran);
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

const missing = [...listed.keys()].filter((key) => !merged.get(key));
const unexpected = [...merged.keys()].filter((key) => !listed.has(key));

console.log(
  `discovered ${listed.size} tests, merged report executed ${listed.size - missing.length} of them`,
);
for (const key of missing) console.error(`not executed: ${key}`);
for (const key of unexpected) console.error(`not discovered: ${key}`);
if (listed.size === 0 || missing.length > 0 || unexpected.length > 0) {
  console.error('executed tests do not match the discovered tests');
  process.exit(1);
}
