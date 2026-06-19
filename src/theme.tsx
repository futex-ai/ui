import { createContext, ReactNode, useContext, useMemo } from "react";

export type SharedUiColors = {
  amber: string;
  amberSoft: string;
  bg: string;
  bg2: string;
  border: string;
  border2: string;
  /**
   * Boundary color for interactive controls (inputs, the date trigger, the
   * dropdown selector, secondary buttons, segmented cells, radio cards, the
   * switch track). Unlike `border`/`border2`, which are decorative dividers and
   * are exempt from contrast rules, this is held to WCAG 2.1 — 1.4.11 Non-text
   * Contrast (AA): ≥3:1 against both the surface and the page background so the
   * edge of a control is perceivable.
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
  roseSoft: string;
  soft: string;
  surface: string;
};

export type SharedUiFonts = {
  mono: string;
  sans: string;
};

export type SharedUiRadii = {
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
};

export type SharedUiThemeOverrides = {
  colors?: Partial<SharedUiColors>;
  fonts?: Partial<SharedUiFonts>;
  radii?: Partial<SharedUiRadii>;
};

export const defaultSharedUiTheme: SharedUiTheme = {
  colors: {
    amber: "#946727",
    amberSoft: "#f4ecd8",
    bg: "#f7f7f3",
    bg2: "#ecede7",
    border: "#e5e8e0",
    border2: "#d3d8cd",
    controlBorder: "#8b908b",
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
    roseSoft: "#f4e3df",
    soft: "#eef2ed",
    surface: "#ffffff",
  },
  fonts: {
    mono: "Menlo, Consolas, monospace",
    sans: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  radii: {
    lg: 10,
    md: 8,
    pill: 999,
    sm: 6,
    xl: 12,
    xxl: 14,
  },
};

const SharedUiThemeContext = createContext<SharedUiTheme>(defaultSharedUiTheme);

export function createSharedUiTheme(
  overrides: SharedUiThemeOverrides = {},
): SharedUiTheme {
  return {
    colors: { ...defaultSharedUiTheme.colors, ...overrides.colors },
    fonts: { ...defaultSharedUiTheme.fonts, ...overrides.fonts },
    radii: { ...defaultSharedUiTheme.radii, ...overrides.radii },
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
    amberSoft: "#FBF1DC",
    bg: "#FAFAFA",
    bg2: "#F5F5F5",
    border: "#EBEBEB",
    border2: "#D8D8D8",
    controlBorder: "#939099",
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
