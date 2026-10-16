import { runBurnIn } from '@seontechnologies/playwright-utils/burn-in';

const baseArgument = process.argv.find((argument) => argument.startsWith('--base-branch='));

await runBurnIn({
  configPath: 'tests/config/burn-in.config.ts',
  baseBranch: baseArgument ? baseArgument.slice('--base-branch='.length) : 'main',
});
