/**
 * Shard layout for the visual/ARIA snapshot sweep in `snapshots.spec.ts`.
 *
 * The sweep opens every Storybook story in its own browser context, so its cost
 * is linear in the story count and has to be spread across Playwright's workers
 * to stay inside the existing browser-test budget. Checking runs splits the
 * sorted story list into four deterministic shards — matching the axe sweep, and
 * matching Playwright's default worker count on an 8-CPU machine — while a
 * recording run uses one serial sweep so baselines are written by a single
 * worker with the machine to itself.
 *
 * Only the shard layout lives here. Splitting a sorted story list across shards
 * is the same operation both sweeps need, so `snapshots.spec.ts` reuses
 * `storiesForShard` from `./a11ySharding` rather than growing a second copy.
 */
export type SnapshotSweepShard = Readonly<{
  index: number;
  total: number;
}>;

const SNAPSHOT_SWEEP_SHARD_COUNT = 4;

export function snapshotSweepShards(recording: boolean): SnapshotSweepShard[] {
  const total = recording ? 1 : SNAPSHOT_SWEEP_SHARD_COUNT;
  return Array.from({ length: total }, (_, index) => ({ index, total }));
}

/**
 * Whether this run records baselines rather than checking them.
 *
 * Playwright's own `--update-snapshots` is read per assertion inside the worker,
 * too late to choose a shard layout, and it is not visible to the worker that
 * loads this file. `SNAPSHOT_UPDATE=1` is therefore the switch that collapses
 * the sweep to one serial shard. `--update-snapshots` on its own still records
 * correctly — each story owns its own baseline files, so parallel shards never
 * contend for a writer — it just records four shards at once.
 */
export function isRecordingSnapshots(env: NodeJS.ProcessEnv): boolean {
  return env.SNAPSHOT_UPDATE === "1";
}
