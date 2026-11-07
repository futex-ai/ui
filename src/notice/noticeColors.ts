/**
 * The colours of a {@link Notice} tone, resolved from the theme. Pure, so the
 * contrast of each text colour on its fill is checked for every preset.
 */
import { rgbChannels } from "../focusRingCss";
import type { SharedUiColors } from "../theme";

/**
 * The emphasis of a notice: `neutral` is ordinary content, and `urgent` is an
 * alert that assistive technology announces.
 */
export type NoticeTone = "neutral" | "urgent";

/** The colours that a notice tone paints with. */
export type NoticeColors = {
  /** The body text. */
  body: string;
  /** The fill of the box. */
  fill: string;
  /** A lucide `icon` glyph. */
  icon: string;
  /** The outline on every edge of the box. */
  outline: string;
  /** The title text. */
  title: string;
};

/**
 * The alpha of the urgent outline. The theme has no danger outline token, so
 * the outline is the danger colour, faint enough to read as a hairline.
 */
const URGENT_OUTLINE_ALPHA = 0.35;

/**
 * The colours of a tone. The tone shows as a fill and an outline on every
 * edge, never as an accent strip. The urgent colours derive from the theme's
 * danger colour; the neutral notice sits on the page's quiet fill.
 */
export function noticeColors(
  colors: SharedUiColors,
  tone: NoticeTone,
): NoticeColors {
  if (tone === "urgent") {
    const channels = rgbChannels(colors.rose);
    return {
      body: colors.ink2,
      fill: colors.roseSoft,
      icon: colors.rose,
      outline:
        channels == null
          ? colors.rose
          : `rgba(${channels}, ${URGENT_OUTLINE_ALPHA})`,
      title: colors.ink,
    };
  }
  return {
    body: colors.ink2,
    fill: colors.bg,
    icon: colors.muted,
    outline: colors.border2,
    title: colors.ink,
  };
}
