import type {
  ButtonProps,
  ButtonStateStyleArgs,
  ButtonTone,
} from "@firna/ui/button";
import { focusRingColorFor } from "@firna/ui/focusRing";
import type { PanelResizeHandleProps } from "@firna/ui/panel-resize";
import type { SharedUiTheme } from "@firna/ui/theme";

/**
 * An interaction state that a static view draws, because a view runs no
 * script: the pointer over a control, keyboard focus, or an open menu.
 */
export type DrawnState = "rest" | "hover" | "focus" | "open";

/** A plain style that a library `Button` accepts. */
export type ButtonStyle = Exclude<
  ButtonProps["style"],
  (state: ButtonStateStyleArgs) => unknown
>;

/** The library focus glow: 4 px of the primary colour at 35% alpha. */
function glowShadow(theme: SharedUiTheme): string {
  return `0 0 0 4px ${focusRingColorFor(theme.colors.primary)}`;
}

/** The library focus glow as the style of a control. */
export function focusGlow(theme: SharedUiTheme): ButtonStyle {
  return { boxShadow: glowShadow(theme) };
}

function hoverFill(theme: SharedUiTheme, tone: ButtonTone): ButtonStyle {
  const { colors } = theme;
  switch (tone) {
    case "primary":
      return {
        backgroundColor: colors.primaryDeep,
        borderColor: colors.primaryDeep,
      };
    case "ghost":
      return { backgroundColor: colors.primarySoft };
    case "danger":
      return { borderColor: colors.rose };
    case "onMedia":
      return undefined;
    case "plain":
    case "secondary":
      return { backgroundColor: colors.soft };
  }
}

/**
 * The style that draws a state on a library `Button`. The hover and the
 * open fills repeat the button's own hover and pressed treatments.
 */
export function drawnButtonStyle(
  theme: SharedUiTheme,
  tone: ButtonTone,
  state: DrawnState,
): ButtonStyle {
  switch (state) {
    case "rest":
      return undefined;
    case "hover":
      return hoverFill(theme, tone);
    case "focus":
      return focusGlow(theme);
    case "open":
      return { backgroundColor: theme.colors.bg2 };
  }
}

/** The drawn state of a resize handle: at rest, under the pointer, dragged, or focused. */
export type HandleState = "rest" | "hover" | "drag" | "focus";

/**
 * The `lineStyle` and `gripStyle` of a library `PanelResizeHandle` in a
 * drawn state. Under the pointer and during a drag, the line darkens and the
 * grip shows. Keyboard focus adds the focus glow around the grip, as the
 * handle draws it.
 */
export function drawnHandleStyles(
  theme: SharedUiTheme,
  state: HandleState,
): Pick<PanelResizeHandleProps, "gripStyle" | "lineStyle"> {
  if (state === "rest") {
    return {};
  }
  return {
    gripStyle:
      state === "focus"
        ? { boxShadow: glowShadow(theme), opacity: 1 }
        : { opacity: 1 },
    lineStyle: { backgroundColor: theme.colors.border2 },
  };
}
