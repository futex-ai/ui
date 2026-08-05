import { createContext, ReactNode, useContext, useMemo } from "react";

export type SharedUiColors = {
  amber: string;
  /**
   * Deep amber for the warning tone: the badge's `soft` warning text on
   * `amberSoft` and the `solid` warning fill under `onSolid` text (white in the
   * light themes; in the dark themes the fill lightens and `onSolid` darkens
   * instead). Held to WCAG 2.1 — 1.4.3 (AA): ≥4.5:1 on `amberSoft` and as a
   * fill under `onSolid` in all four shipped themes, since the lighter `amber`
   * accent falls below AA on its own soft tint. Mirrors `primaryDeep`.
   */
  amberDeep: string;
  amberSoft: string;
  bg: string;
  bg2: string;
  border: string;
  border2: string;
  /**
   * Boundary color for interactive controls (inputs, the date trigger, the
   * dropdown selector, secondary buttons, segmented cells, radio cards, the
   * switch's resting knob — and the switch track at half alpha, the one place
   * the edge paints over a grey fill instead of white). A translucent tint of
   * the theme's `ink` (≈27% opacity) rather than a fixed grey: the edge
   * composites with whatever sits behind it, so it reads as an unobtrusive line
   * on the `surface` (≈1.4:1 on the light themes' white) and stays
   * proportionate — lifting gently over the grayer page or a tinted fill
   * instead of floating as a hard grey outline. In the dark themes the light
   * `ink` composites the same way, as a light line over the dark fills. Kept in
   * sync by hand with `ink` in all four shipped themes. Intentionally below the
   * WCAG 2.1 — 1.4.11 Non-text Contrast (AA) ≥3:1 floor: a calmer, blended edge
   * is the deliberate trade. `border`/`border2` remain the even lighter
   * decorative dividers.
   */
  controlBorder: string;
  faint: string;
  ink: string;
  ink2: string;
  muted: string;
  /**
   * Text and icon color on solid accent fills — the badge/button/avatar solid
   * variants, the dropdown's solid active row, the calendar "today" disc and
   * event blocks, the selected date cell, the radio check, the switch knob at
   * the on-position, the combobox count mark, the drag-select count badge and
   * the rich-text checkbox tick. White in the light themes; in the dark themes
   * solid fills invert to light accents, so this flips to the near-black page
   * ink-well. Held to WCAG 2.1 — 1.4.3 (AA): ≥4.5:1 on `primary`, `ink2` and
   * every `*Deep` fill in all four shipped themes.
   */
  onSolid: string;
  /**
   * Placeholder / faint-but-meaningful text color. Held to WCAG 2.1 — 1.4.3
   * Contrast Minimum (AA): ≥4.5:1 on `surface` in all four shipped themes. Use
   * this instead of `faint` (which stays light for decorative use) wherever the
   * text conveys meaning.
   */
  placeholder: string;
  primary: string;
  primaryBorder: string;
  primaryDeep: string;
  primarySoft: string;
  rose: string;
  /**
   * Deep rose for the danger tone: the badge's `soft` danger text on `roseSoft`
   * and the `solid` danger fill under `onSolid` text (white in the light
   * themes; in the dark themes the fill lightens and `onSolid` darkens
   * instead). Held to WCAG 2.1 — 1.4.3 (AA): ≥4.5:1 on `roseSoft` and as a fill
   * under `onSolid` in all four shipped themes, since the lighter `rose` accent
   * falls below AA on its own soft tint. Mirrors `primaryDeep`.
   */
  roseDeep: string;
  roseSoft: string;
  soft: string;
  surface: string;
};

export type SharedUiFonts = {
  mono: string;
  sans: string;
};

export type SharedUiRadii = {
  /**
   * Corner radius of `Avatar`'s `shape="square"` as a fraction of its `size`,
   * clamped to `[0, 0.5]`. A ratio rather than a pixel value so a rounded
   * square looks identical at every avatar size.
   */
  avatarRatio: number;
  lg: number;
  md: number;
  pill: number;
  sm: number;
  xl: number;
  xxl: number;
};

export type SharedUiScheme = "light" | "dark";

export type SharedUiTheme = {
  colors: SharedUiColors;
  fonts: SharedUiFonts;
  radii: SharedUiRadii;
  /**
   * Global focus-glow switch. Defaults to `true`. Set `false` to disable the
   * shared focus ring on every control at once (see {@link useFocusRing}); each
   * control can also opt out individually via its `disableFocusRing` prop. When
   * off, controls fall back to the browser's default focus outline so keyboard
   * focus stays visible (WCAG 2.1 — 2.4.7 Focus Visible, AA).
   */
  focusRing: boolean;
  /**
   * Which side of the light/dark divide this theme's palette sits on. Almost
   * no component should branch on it — colors flow through tokens — but the
   * few physical-metaphor sites (the white skeleton sheen, the switch knob's
   * off-state fill, the solid toast's hover wash, the data-grid's fixed pill
   * pairs) legitimately need to know. Defaults to "light".
   */
  scheme: SharedUiScheme;
};

export type SharedUiThemeOverrides = {
  colors?: Partial<SharedUiColors>;
  fonts?: Partial<SharedUiFonts>;
  radii?: Partial<SharedUiRadii>;
  focusRing?: boolean;
  scheme?: SharedUiScheme;
};

export const defaultSharedUiTheme: SharedUiTheme = {
  colors: {
    amber: "#946727",
    amberDeep: "#75531a",
    amberSoft: "#f4ecd8",
    bg: "#f7f7f3",
    bg2: "#ecede7",
    border: "#e5e8e0",
    border2: "#d3d8cd",
    controlBorder: "rgba(28, 31, 29, 0.27)", // ink (#1c1f1d) @ 27% — translucent control edge
    faint: "#a8aea7",
    ink: "#1c1f1d",
    ink2: "#3e4540",
    muted: "#69706a",
    onSolid: "#ffffff",
    placeholder: "#6c736c",
    primary: "#4f7864",
    primaryBorder: "#d1e2d7",
    primaryDeep: "#2f5945",
    primarySoft: "#e3eee6",
    rose: "#a84f45",
    roseDeep: "#8f3a30",
    roseSoft: "#f4e3df",
    soft: "#eef2ed",
    surface: "#ffffff",
  },
  fonts: {
    mono: "Menlo, Consolas, monospace",
    sans: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  radii: {
    avatarRatio: 0.25,
    lg: 10,
    md: 8,
    pill: 999,
    sm: 6,
    xl: 12,
    xxl: 14,
  },
  focusRing: true,
  scheme: "light",
};

const SharedUiThemeContext = createContext<SharedUiTheme>(defaultSharedUiTheme);

export function createSharedUiTheme(
  overrides: SharedUiThemeOverrides = {},
  base: SharedUiTheme = defaultSharedUiTheme,
): SharedUiTheme {
  return {
    colors: { ...base.colors, ...overrides.colors },
    fonts: { ...base.fonts, ...overrides.fonts },
    radii: { ...base.radii, ...overrides.radii },
    focusRing: overrides.focusRing ?? base.focusRing,
    scheme: overrides.scheme ?? base.scheme,
  };
}

export function SharedUiThemeProvider({
  children,
  theme,
}: {
  children: ReactNode;
  theme?: SharedUiThemeOverrides | SharedUiTheme;
}) {
  const value = useMemo(() => createSharedUiTheme(theme), [theme]);
  return (
    <SharedUiThemeContext.Provider value={value}>
      {children}
    </SharedUiThemeContext.Provider>
  );
}

export function useSharedUiTheme(): SharedUiTheme {
  return useContext(SharedUiThemeContext);
}

export const junoSharedUiTheme = createSharedUiTheme({
  colors: {
    amber: "#C28C3A",
    amberDeep: "#80561c",
    amberSoft: "#FBF1DC",
    bg: "#FAFAFA",
    bg2: "#F5F5F5",
    border: "#EBEBEB",
    border2: "#D8D8D8",
    controlBorder: "rgba(21, 19, 31, 0.27)", // ink (#15131F) @ 27% — translucent control edge
    faint: "#93919E",
    ink: "#15131F",
    ink2: "#3D3A4E",
    muted: "#65627A",
    onSolid: "#ffffff",
    placeholder: "#6F6C7E",
    primary: "#6F5BD0",
    primaryBorder: "#E2DAF5",
    primaryDeep: "#5A47BD",
    primarySoft: "#F0EBFA",
    rose: "#B85555",
    roseDeep: "#9a4138",
    roseSoft: "#FFF1F1",
    soft: "#F5F5F5",
    surface: "#FFFFFF",
  },
  radii: {
    lg: 14,
    md: 10,
    sm: 8,
    xl: 18,
    xxl: 22,
  },
});

/**
 * Dark counterpart of the accounting default: warm green-tinted greys with the
 * sage accents lightened for a dark surface. Elevation inverts — `surface`
 * sits *above* `bg` by being slightly lighter — and solid fills invert too:
 * the `*Deep` tokens become the light accents and `onSolid` becomes the page
 * ink-well, so every existing token relationship (deep-on-soft, deep-as-fill,
 * the heatmap ramp's ordering) keeps working with no per-component logic.
 * Every documented WCAG 2.1 — 1.4.3/1.4.11 pair is pinned by
 * `tests/unit/darkTheme.test.ts`.
 */
export const darkSharedUiTheme = createSharedUiTheme({
  scheme: "dark",
  colors: {
    amber: "#cfa763",
    amberDeep: "#e3c186",
    amberSoft: "#322a19",
    bg: "#141613",
    bg2: "#1b1e1b",
    border: "#2a2e2a",
    border2: "#3a403a",
    controlBorder: "rgba(230, 233, 228, 0.27)", // ink (#e6e9e4) @ 27% — translucent control edge
    faint: "#5c635b",
    ink: "#e6e9e4",
    ink2: "#c3c9c2",
    muted: "#9aa29a",
    onSolid: "#141613",
    placeholder: "#9aa29a",
    primary: "#7aa78e",
    primaryBorder: "#33493d",
    primaryDeep: "#a3cdb4",
    primarySoft: "#223029",
    rose: "#cd8478",
    roseDeep: "#eba99d",
    roseSoft: "#382220",
    soft: "#252a25",
    surface: "#212522",
  },
});

/**
 * Dark Juno: cool violet-tinted greys. Built on {@link junoSharedUiTheme} as
 * its base so it inherits Juno's larger radii, and follows the same
 * solid-inversion model as {@link darkSharedUiTheme}.
 */
export const junoDarkSharedUiTheme = createSharedUiTheme(
  {
    scheme: "dark",
    colors: {
      amber: "#d9a852",
      amberDeep: "#e8c37e",
      amberSoft: "#322913",
      bg: "#131218",
      bg2: "#19181f",
      border: "#282631",
      border2: "#38353f",
      controlBorder: "rgba(232, 230, 240, 0.27)", // ink (#e8e6f0) @ 27%
      faint: "#615e70",
      ink: "#e8e6f0",
      ink2: "#c7c3d6",
      muted: "#9d99ae",
      onSolid: "#131218",
      placeholder: "#9d99ae",
      primary: "#9b8ce8",
      primaryBorder: "#3b3459",
      primaryDeep: "#b6aaf5",
      primarySoft: "#272239",
      rose: "#d98282",
      roseDeep: "#f0a3a3",
      roseSoft: "#3a1f1f",
      soft: "#1f1d27",
      surface: "#1e1c25",
    },
  },
  junoSharedUiTheme,
);
