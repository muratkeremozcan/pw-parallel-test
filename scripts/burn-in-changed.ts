/**
 * Burns in the tests a branch changed, through playwright-utils `runBurnIn`, with two guards:
 *
 * - playwright-utils 4.4.1 builds its dependency graph with madge, whose keys are relative to the
 *   working directory, then looks them up by absolute path. A spec is therefore selected only when
 *   the spec file itself changed. A change to anything a spec imports (support code, config,
 *   dependencies) burns in the whole suite here instead.
 * - `runBurnIn` joins file names into a shell command, so a changed file whose name holds anything
 *   beyond letters, digits, `.`, `_`, `-` and `/` stops the run before any command executes.
 *
 * Usage: node scripts/burn-in-changed.ts [--base-branch=origin/main]
 */
import { execFileSync } from 'node:child_process';
import { runBurnIn } from '@seontechnologies/playwright-utils/burn-in';
import config from '../tests/config/burn-in.config.ts';

const CONFIG_PATH = 'tests/config/burn-in.config.ts';
const SAFE_PATH = /^[A-Za-z0-9._/-]+$/;
const SPEC = /^tests\/.+\.(?:spec|setup)\.ts$/;
// Changes that cannot alter what a test does; tests/config/burn-in.config.ts skips the same set.
const IGNORED =
  /^(?:\.github|_bmad|\.tea|\.claude|results|scripts)\/|^(?:LICENSE|\.gitignore|\.prettierignore|\.prettierrc\.json)$|\.md$/;

const baseArgument = process.argv.find((argument) => argument.startsWith('--base-branch='));
const baseBranch = baseArgument ? baseArgument.slice('--base-branch='.length) : 'main';
if (!SAFE_PATH.test(baseBranch)) {
  throw new Error(`refusing an unsafe base branch name: ${JSON.stringify(baseBranch)}`);
}

const changed = execFileSync('git', ['diff', '--name-only', `${baseBranch}...HEAD`], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);

const unsafe = changed.filter((file) => !SAFE_PATH.test(file));
if (unsafe.length > 0) {
  console.error(`refusing to burn in files with unsafe names: ${JSON.stringify(unsafe)}`);
  process.exit(1);
}

const imported = changed.filter((file) => !SPEC.test(file) && !IGNORED.test(file));
if (imported.length > 0) {
  const repeatEach = String(config.burnIn?.repeatEach ?? 3);
  const retries = String(config.burnIn?.retries ?? 0);
  console.log(`Changed files that specs import or run under: ${imported.join(', ')}`);
  console.log(`Burning in the whole suite (--repeat-each=${repeatEach} --retries=${retries}).`);
  execFileSync(
    'npx',
    ['playwright', 'test', `--repeat-each=${repeatEach}`, `--retries=${retries}`],
    {
      stdio: 'inherit',
      env: { ...process.env, PW_BURN_IN: 'true' },
    },
  );
} else {
  await runBurnIn({ configPath: CONFIG_PATH, baseBranch });
}
