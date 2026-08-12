export type AccessibilitySweepShard = Readonly<{
  index: number;
  total: number;
}>;

const ACCESSIBILITY_SWEEP_SHARD_COUNT = 4;

export function accessibilitySweepShards(
  updateBaseline: boolean,
): AccessibilitySweepShard[] {
  const total = updateBaseline ? 1 : ACCESSIBILITY_SWEEP_SHARD_COUNT;
  return Array.from({ length: total }, (_, index) => ({ index, total }));
}

export function storiesForShard<T>(
  stories: readonly T[],
  shard: AccessibilitySweepShard,
): T[] {
  return stories.filter((_, index) => index % shard.total === shard.index);
}
