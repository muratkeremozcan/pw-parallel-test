/**
 * Reduces one Playwright blob report (`report.jsonl`) to the facts a measurement needs. Only the
 * fields read here leave this function, so absolute paths and environment data in the blob never
 * reach a committed record. Adapted from measurements/blob.js on the s6-candidates branch of
 * muratkeremozcan/playwright-smart-parallelization (MIT).
 */

export type Attempt = { retry: number; status: string; duration: number };

export type TestRecord = {
  id: string;
  project: string;
  file: string;
  titlePath: string[];
  title: string;
  repeatEachIndex: number;
  /** Playwright's tags, which mark the serial group; absent in records of schema 2. */
  tags?: string[];
  attempts: Attempt[];
};

export type ShardReport = {
  playwrightVersion: string;
  node: string | null;
  shard: { current: number; total: number } | null;
  workers: number;
  /** `fullyParallel` from the config metadata; absent in records of schema 2. */
  fullyParallel?: boolean;
  projects: { name: string; dependencies: string[]; retries: number }[];
  run: { status: string; startTime: number; duration: number };
  tests: TestRecord[];
};

type Entry = {
  testId?: string;
  title: string;
  location: { file: string };
  repeatEachIndex?: number;
  tags?: string[];
  entries?: Entry[];
};

type Event = { method: string; params: Record<string, any> };

const parseJsonl = (text: string): Event[] =>
  text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as Event);

const collectTests = (
  entries: Entry[],
  titlePath: string[],
  project: string,
  out: Map<string, TestRecord>,
) => {
  for (const entry of entries) {
    if (entry.testId !== undefined) {
      out.set(entry.testId, {
        id: entry.testId,
        project,
        file: entry.location.file,
        titlePath,
        title: entry.title,
        repeatEachIndex: entry.repeatEachIndex ?? 0,
        tags: entry.tags ?? [],
        attempts: [],
      });
    } else {
      collectTests(entry.entries ?? [], [...titlePath, entry.title], project, out);
    }
  }
};

export const reduceBlob = (text: string): ShardReport => {
  const events = parseJsonl(text);
  const find = (method: string) => events.find((event) => event.method === method);
  const metadata = find('onBlobReportMetadata');
  const configure = find('onConfigure');
  const end = find('onEnd');
  if (!metadata || !configure || !end) {
    throw new Error('blob report lacks its metadata, configuration or end event');
  }

  const tests = new Map<string, TestRecord>();
  const projects: ShardReport['projects'] = [];
  for (const event of events) {
    if (event.method !== 'onProject') continue;
    const project = event.params.project;
    projects.push({
      name: project.name,
      dependencies: project.dependencies,
      retries: project.retries,
    });
    for (const suite of project.suites as Entry[]) {
      // A top-level suite is a file; its title is the file path, already on each test.
      collectTests(suite.entries ?? [], [], project.name, tests);
    }
  }

  const begun = new Map<string, { testId: string; retry: number }>();
  const ended = new Set<string>();
  for (const event of events) {
    if (event.method === 'onTestBegin') {
      const { testId, result } = event.params;
      begun.set(result.id, { testId, retry: result.retry });
    } else if (event.method === 'onTestEnd') {
      const { test, result } = event.params;
      const start = begun.get(result.id);
      if (!start) throw new Error(`attempt ${result.id} ended without beginning`);
      const record = tests.get(test.testId);
      if (!record) throw new Error(`attempt of unlisted test ${test.testId}`);
      record.attempts.push({
        retry: start.retry,
        status: result.status,
        duration: result.duration,
      });
      ended.add(result.id);
    }
  }
  for (const id of begun.keys()) {
    if (!ended.has(id)) throw new Error(`attempt ${id} began but never ended`);
  }

  const fullyParallel = configure.params.config.metadata?.fullyParallel;
  if (typeof fullyParallel !== 'boolean') {
    throw new Error('blob report config metadata lacks a boolean fullyParallel');
  }
  const node = /\bnode\/(\S+)/.exec(metadata.params.userAgent);
  return {
    playwrightVersion: configure.params.config.version,
    node: node ? node[1] : null,
    shard: metadata.params.shard ?? null,
    workers: configure.params.config.workers,
    fullyParallel,
    projects,
    run: {
      status: end.params.result.status,
      startTime: end.params.result.startTime,
      duration: end.params.result.duration,
    },
    tests: [...tests.values()].filter((test) => test.attempts.length > 0),
  };
};
