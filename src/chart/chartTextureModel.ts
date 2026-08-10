/**
 * The texture channel's pure parts, kept free of React Native imports so the
 * rules are unit-testable.
 *
 * Texture earns its place only for full colour-vision deficiency, greyscale
 * print, and `forced-colors`. It is **never decorative and never on by
 * default**: dense angled fields are a vestibular risk and read as noise on a
 * value scale.
 */

/**
 * The two permitted angles, in degrees. Horizontal and vertical are excluded
 * deliberately — they read as gridlines and as bars respectively.
 */
export const TEXTURE_ANGLES = [45, 135] as const;

export type TextureAngle = (typeof TEXTURE_ANGLES)[number];

/**
 * A stable pattern id for a series.
 *
 * Sanitised because the id becomes an SVG fragment reference inside `url(#…)`,
 * and series ids routinely come from API responses or CSV headers.
 */
export function texturePatternId(seriesId: string): string {
  return `chart-texture-${seriesId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

/** The `fill` value for a series when texture is on, or its plain colour. */
export function textureFill(
  seriesId: string,
  color: string,
  enabled: boolean,
): string {
  return enabled ? `url(#${texturePatternId(seriesId)})` : color;
}
