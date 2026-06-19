/** Tone-driven colours and contrast helpers for toast surfaces. */
import type { SharedUiTheme } from "../theme";

import type { ToastTone } from "./toastModel";

/** Tone accent colour for the card strip and leading icon. */
export function toastToneAccent(theme: SharedUiTheme, tone: ToastTone): string {
  switch (tone) {
    case "error":
      return theme.colors.rose;
    case "success":
      return theme.colors.primary;
    case "warning":
      return theme.colors.amber;
    default:
      return theme.colors.primaryDeep;
  }
}

/** Filled background colour for the compact solid variant. */
export function toastSolidToneBackground(
  theme: SharedUiTheme,
  tone: ToastTone,
): string {
  switch (tone) {
    case "error":
      return theme.colors.rose;
    case "success":
      return theme.colors.primary;
    case "warning":
      return theme.colors.amber;
    default:
      return theme.colors.primaryDeep;
  }
}

/** Foreground for filled toasts, falling back to ink when white is too low contrast. */
export function toastSolidToneForeground(
  theme: SharedUiTheme,
  background: string,
): string {
  if (toastContrastRatio(theme.colors.surface, background) >= 4.5) {
    return theme.colors.surface;
  }
  return theme.colors.ink;
}

/** WCAG contrast ratio for theme hex colours; unknown formats fail closed. */
export function toastContrastRatio(
  foreground: string,
  background: string,
): number {
  const foregroundLuminance = toastRelativeLuminance(foreground);
  const backgroundLuminance = toastRelativeLuminance(background);
  if (foregroundLuminance === null || backgroundLuminance === null) {
    return 0;
  }
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Relative luminance for #rgb and #rrggbb colours. */
function toastRelativeLuminance(color: string): number | null {
  const channels = toastHexChannels(color);
  if (channels === null) {
    return null;
  }
  const [red, green, blue] = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

/** Parses a CSS hex colour into RGB channels. */
function toastHexChannels(color: string): [number, number, number] | null {
  const value = color.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(value);
  if (short) {
    return short[1]
      .split("")
      .map((channel) => Number.parseInt(`${channel}${channel}`, 16)) as [
      number,
      number,
      number,
    ];
  }
  const long = /^#([0-9a-f]{6})$/i.exec(value);
  if (!long) {
    return null;
  }
  return [
    Number.parseInt(long[1].slice(0, 2), 16),
    Number.parseInt(long[1].slice(2, 4), 16),
    Number.parseInt(long[1].slice(4, 6), 16),
  ];
}
