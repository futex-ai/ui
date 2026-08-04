import { createContext, ReactNode, useContext, useMemo } from "react";

export type SharedUiColors = {
  amber: string;
  /**
   * Deep amber for the warning tone: the badge's `soft` warning text on
   * `amberSoft` and the `solid` warning fill under white text. Held to WCAG
   * 2.1 — 1.4.3 (AA): ≥4.5:1 on `amberSoft` and as a fill under white in both
   * shipped themes, since the lighter `amber` accent falls below AA on its own
   * soft tint. Mirrors `primaryDeep`.
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
   * composites with whatever sits behind it, so it reads as a light,
   * unobtrusive line on the white `surface` (≈1.4:1 on #fff) and stays
   * proportionate — lifting gently over the grayer page or a tinted fill
   * instead of floating as a hard grey outline. Kept in sync by hand with
   * `ink`. Intentionally below the WCAG 2.1 — 1.4.11 Non-text Contrast (AA)
   * ≥3:1 floor: a calmer, blended edge is the deliberate trade.
   * `border`/`border2` remain the even lighter decorative dividers.
   */
  controlBorder: string;
  faint: string;
  ink: string;
  ink2: string;
  muted: string;
  /**
   * Placeholder / faint-but-meaningful text color. Held to WCAG 2.1 — 1.4.3
   * Contrast Minimum (AA): ≥4.5:1 on `surface`. Use this instead of `faint`
   * (which stays light for decorative use) wherever the text conveys meaning.
   */
  placeholder: string;
  primary: string;
  primaryBorder: string;
  primaryDeep: string;
  primarySoft: string;
  rose: string;
  /**
   * Deep rose for the danger tone: the badge's `soft` danger text on `roseSoft`
   * and the `solid` danger fill under white text. Held to WCAG 2.1 — 1.4.3
   * (AA): ≥4.5:1 on `roseSoft` and as a fill under white in both shipped
   * themes, since the lighter `rose` accent falls below AA on its own soft
   * tint. Mirrors `primaryDeep`.
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
};

export type SharedUiThemeOverrides = {
  colors?: Partial<SharedUiColors>;
  fonts?: Partial<SharedUiFonts>;
  radii?: Partial<SharedUiRadii>;
  focusRing?: boolean;
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
};

const SharedUiThemeContext = createContext<SharedUiTheme>(defaultSharedUiTheme);

export function createSharedUiTheme(
  overrides: SharedUiThemeOverrides = {},
): SharedUiTheme {
  return {
    colors: { ...defaultSharedUiTheme.colors, ...overrides.colors },
    fonts: { ...defaultSharedUiTheme.fonts, ...overrides.fonts },
    radii: { ...defaultSharedUiTheme.radii, ...overrides.radii },
    focusRing: overrides.focusRing ?? defaultSharedUiTheme.focusRing,
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
