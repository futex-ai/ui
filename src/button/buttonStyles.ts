import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

/**
 * Per-size geometry for the button: track height, horizontal padding, the gap
 * between an optional leading icon and the label, the label type scale, and the
 * matching icon diameter. `md` matches the accounting button this was adapted
 * from (38px tall); `sm` is the compact toolbar density and `lg` the roomier
 * call-to-action density.
 *
 * The `inline*` padding is used only by the {@link ButtonProps.inline} variant:
 * a compact, line-height-neutral in-text chip that drops the fixed track height
 * and instead hugs the label, so its vertical footprint collapses to the label
 * line height (see {@link createButtonStyles}).
 */
const BUTTON_SIZES: Record<
  ControlSize,
  {
    fontSize: number;
    gap: number;
    height: number;
    iconSize: number;
    inlinePaddingHorizontal: number;
    inlinePaddingVertical: number;
    lineHeight: number;
    paddingHorizontal: number;
  }
> = {
  sm: {
    fontSize: 12,
    gap: 6,
    height: 30,
    iconSize: 14,
    inlinePaddingHorizontal: 8,
    inlinePaddingVertical: 2,
    lineHeight: 15,
    paddingHorizontal: 12,
  },
  md: {
    fontSize: 13,
    gap: 6,
    height: 38,
    iconSize: 16,
    inlinePaddingHorizontal: 10,
    inlinePaddingVertical: 3,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  lg: {
    fontSize: 15,
    gap: 8,
    height: 46,
    iconSize: 18,
    inlinePaddingHorizontal: 12,
    inlinePaddingVertical: 4,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
};

/**
 * The `onMedia` tone's translucent white scale, for a control sitting on
 * photography or video rather than an app surface.
 *
 * These are deliberately fixed rather than theme tokens. Every other tone
 * composites against a theme surface and so has to follow the active scheme;
 * imagery is dark in every scheme, so the resting/hover/pressed fills and the
 * label stay white whichever theme is mounted. A scheme-aware `onSolid` would
 * invert to dark text on dark media in the dark presets.
 */
const ON_MEDIA = {
  fill: "rgba(255, 255, 255, 0.14)",
  fillHover: "rgba(255, 255, 255, 0.2)",
  fillPressed: "rgba(255, 255, 255, 0.24)",
  label: "#ffffff",
} as const;

/**
 * Label / leading-icon colour for the `onMedia` tone. Exposed so the component
 * resolves it from the same place as the fills rather than repeating the hex.
 */
export function onMediaLabelColor() {
  return ON_MEDIA.label;
}

/** Diameter of the leading icon for a given button size, in px. */
export function buttonIconSize(size: ControlSize) {
  return BUTTON_SIZES[size].iconSize;
}

/**
 * Track height for a given button size, in px. Exposed so the icon-only
 * `square` / `circle` shapes can derive a 1:1 box from the same per-size scale
 * the labelled button uses (and floor it at a caller `minTouchTarget`).
 */
export function buttonHeight(size: ControlSize) {
  return BUTTON_SIZES[size].height;
}

/**
 * Build the button's themed styles for a given size. The base `button` carries
 * the secondary (default) look — surface fill, `controlBorder` outline,
 * `radii.md` — and the tone styles layer over it. The label colour is applied
 * inline by the component because it depends on the tone.
 */
export function createButtonStyles(theme: SharedUiTheme, size: ControlSize) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  const sizing = BUTTON_SIZES[size];
  return StyleSheet.create({
    block: { alignSelf: "stretch", width: "100%" },
    button: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      // The secondary button's resting edge is a control boundary, so it uses
      // the dedicated `controlBorder` token — a translucent ink tint that reads
      // as a soft, light edge (≈1.4:1 on white, intentionally below the 1.4.11
      // ≥3:1 floor) rather than the decorative `border2`. The ghost tone
      // overrides this to transparent; its label-as-affordance is intentional.
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: sizing.gap,
      height: sizing.height,
      justifyContent: "center",
      paddingHorizontal: sizing.paddingHorizontal,
    },
    danger: { borderColor: theme.colors.roseSoft },
    // Danger is the only tone whose label is a saturated colour (`rose`) on a
    // light fill, so washing the fill like the other tones would push the label
    // below WCAG AA (rose on `roseSoft` is ~4.4:1). Instead its hover sharpens
    // the warning edge from `roseSoft` to full `rose` and keeps the surface
    // fill, so the label's contrast stays at its (AA-passing) resting ratio.
    dangerHover: { borderColor: theme.colors.rose },
    // Pressed sharpens the edge one step further, to `roseDeep`. Danger is the
    // one tone that cannot take a pressed *fill* — see `dangerHover` — so the
    // border carries both steps and the label's contrast never moves.
    dangerPressed: { borderColor: theme.colors.roseDeep },
    disabled: { opacity: 0.55 },
    ghost: { backgroundColor: "transparent", borderColor: "transparent" },
    // The accent's pale tint surfaces on hover (ghost's label is already
    // `primaryDeep`), keeping it visually distinct from the neutral secondary
    // hover while staying borderless.
    ghostHover: { backgroundColor: theme.colors.primarySoft },
    // Pressed deepens the accent wash one step past hover so an active press
    // reads on the borderless tone (both hover + pressed layer, pressed wins).
    ghostPressed: { backgroundColor: theme.colors.primaryBorder },
    // A single centred wrapper for a caller-supplied `iconNode` (e.g. an
    // `@expo/vector-icons` glyph). It is NOT wrapped in `<Text>` — the caller
    // owns the node's colour and size — and is hidden from assistive tech on
    // web like the lucide `icon` (the label / `accessibilityLabel` names it).
    // Its wrapper also ignores pointer targeting in `Button`, keeping focus on
    // the outer pressable even when a caller supplies a focusable child.
    iconNode: { alignItems: "center", justifyContent: "center" },
    // The `inline` variant: a compact, line-height-neutral in-text chip. It drops
    // the fixed track `height` (`"auto"` so the box hugs the label) and takes a
    // tight vertical padding, then pulls that padding — plus the 1px base border
    // — back off with a negative `marginVertical`. The result is a margin box
    // exactly the label's `lineHeight` tall, so the chip occupies the same
    // vertical space as a run of text at its size and never grows the row it sits
    // in; the pill's fill/border overflow the text line above and below without
    // affecting layout. The tone (fill/border/label colour), hover, and focus
    // ring all still layer on from the shared tone styles.
    inline: {
      height: "auto",
      marginVertical: -(sizing.inlinePaddingVertical + 1),
      paddingHorizontal: sizing.inlinePaddingHorizontal,
      paddingVertical: sizing.inlinePaddingVertical,
    },
    label: {
      ...baseText,
      fontSize: sizing.fontSize,
      fontWeight: "700",
      lineHeight: sizing.lineHeight,
    },
    // The `onMedia` tone: a translucent white control for photography or video.
    // Borderless, because a hairline edge disappears against a busy image; the
    // fill is what separates it from the picture behind.
    onMedia: {
      backgroundColor: ON_MEDIA.fill,
      borderColor: "transparent",
    },
    onMediaHover: { backgroundColor: ON_MEDIA.fillHover },
    // A press on media has to read without a surface to tint against, so the
    // white veil thickens rather than shifting hue.
    onMediaPressed: { backgroundColor: ON_MEDIA.fillPressed },
    // The `plain` tone: a flush, borderless neutral button (an `ink` label /
    // icon on no resting fill or border) for chrome-less header / composer icon
    // buttons. Distinct from `ghost`, whose label carries the brand accent.
    plain: { backgroundColor: "transparent", borderColor: "transparent" },
    // The neutral hover / pressed washes, reused from the list row so a flush
    // icon button tints in step with the rest of the library's neutral surfaces.
    plainHover: { backgroundColor: theme.colors.soft },
    plainPressed: { backgroundColor: theme.colors.bg2 },
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    // A filled tone can't take a light wash, so hover deepens the fill (and its
    // matching border) to `primaryDeep`, which also raises the white label's
    // contrast rather than weakening it.
    primaryHover: {
      backgroundColor: theme.colors.primaryDeep,
      borderColor: theme.colors.primaryDeep,
    },
    // `primaryDeep` is the darkest accent the theme contract defines, so a
    // pressed primary cannot deepen its fill a second time. It dims the whole
    // control instead — the same feedback `TouchableOpacity` gives natively, and
    // a shallow enough step (12%) that the white label stays above AA on the
    // composited fill.
    primaryPressed: { opacity: 0.88 },
    // The neutral hover, reused verbatim from the calendar cells: swap the white
    // surface for `soft`, holding the `border2` edge.
    secondaryHover: { backgroundColor: theme.colors.soft },
    // One step past the hover wash, mirroring the `plain` pair so a bordered
    // and a borderless neutral control press to the same depth.
    secondaryPressed: { backgroundColor: theme.colors.bg2 },
  });
}

export type ButtonStyles = ReturnType<typeof createButtonStyles>;
