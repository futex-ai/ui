/**
 * Filtering, grouping, and description for {@link MediaBin}. Pure and free of
 * any runtime `react-native` import, so `node --test` drives it directly.
 */
import { formatClock } from "../timeline/timelineTime";

/** What an asset is, which drives its icon and its spoken description. */
export type MediaAssetKind = "audio" | "image" | "title" | "video";

export type MediaAsset = {
  id: string;
  name: string;
  kind: MediaAssetKind;
  /** Length in seconds. Omit for a still. */
  duration?: number;
  /** A representative frame, as any URI `Image` accepts. */
  thumbnail?: string;
  /** Folder or bin the asset belongs to. */
  group?: string;
  /** Short trailing caption — a codec, a resolution, a take number. */
  badge?: string;
};

/**
 * Assets matching `query`, case-insensitively, across the name, the group, and
 * the badge — so typing "interview" finds the take and typing "audio" finds the
 * folder. An empty query matches everything.
 */
export function filterAssets(
  assets: readonly MediaAsset[],
  query: string,
): MediaAsset[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return [...assets];
  }
  return assets.filter((asset) =>
    [asset.name, asset.group, asset.badge]
      .filter((field): field is string => Boolean(field))
      .some((field) => field.toLowerCase().includes(needle)),
  );
}

/** A named run of assets, in the order the groups were first seen. */
export type MediaAssetGroup = { assets: MediaAsset[]; title: string };

/**
 * Groups assets by their `group`, preserving first-seen order rather than
 * sorting alphabetically — a bin's folders have a meaningful order that the
 * consumer chose. Ungrouped assets collect under `fallbackTitle`.
 */
export function groupAssets(
  assets: readonly MediaAsset[],
  fallbackTitle = "Media",
): MediaAssetGroup[] {
  const groups: MediaAssetGroup[] = [];
  const byTitle = new Map<string, MediaAssetGroup>();
  for (const asset of assets) {
    const title = asset.group ?? fallbackTitle;
    let group = byTitle.get(title);
    if (!group) {
      group = { assets: [], title };
      byTitle.set(title, group);
      groups.push(group);
    }
    group.assets.push(asset);
  }
  return groups;
}

/**
 * The spoken description of an asset: its name, what it is, and how long — so
 * the duration badge and the kind icon both reach a screen-reader user
 * (WCAG 2.1 — 1.1.1 Non-text Content, A).
 */
export function describeAsset(asset: MediaAsset): string {
  const parts = [asset.name, asset.kind];
  if (asset.duration !== undefined && asset.duration > 0) {
    parts.push(formatClock(asset.duration));
  }
  if (asset.badge) {
    parts.push(asset.badge);
  }
  return parts.join(", ");
}

/** The trailing caption drawn on a thumbnail — a duration, or nothing. */
export function assetDurationLabel(asset: MediaAsset): string | null {
  return asset.duration !== undefined && asset.duration > 0
    ? formatClock(asset.duration)
    : null;
}
