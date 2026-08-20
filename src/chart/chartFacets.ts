/** Facet maths for small multiples. Pure, so the shared-domain rule is testable. */

/**
 * The union of several facets' extents — the domain every panel must share.
 *
 * Facets drawn on independent scales look comparable while being nothing of
 * the sort, which is the whole failure mode small multiples exist to avoid.
 * Zero is included so bar facets are not truncated.
 */
export function sharedExtent(
  facets: readonly { data: readonly (number | null)[] }[],
): [number, number] {
  const values = facets
    .flatMap((facet) => facet.data)
    .filter((v): v is number => v != null && Number.isFinite(v));
  if (values.length === 0) {
    return [0, 1];
  }
  return [Math.min(0, ...values), Math.max(...values)];
}
