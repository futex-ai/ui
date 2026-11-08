/**
 * A link with the look of a {@link Button}: a real anchor on web, and a link
 * that opens its destination on native.
 */
import { IconComponent } from "../primitives/icons";
import { Link, type LinkInteractionState } from "../primitives/link";
import { ReactNode, Ref, useMemo } from "react";
import {
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
} from "../primitives/reactNative";

import { ButtonContent } from "../button/ButtonContent";
import {
  buttonLabelColor,
  buttonPaintLayers,
  buttonShapeStyle,
} from "../button/buttonPaint";
import type { ButtonShape, ButtonTone } from "../button/buttonProps";
import {
  buttonIconSize,
  createButtonStyles,
  createTouchButtonStyles,
} from "../button/buttonStyles";
import type { ControlSize } from "../controlSize";
import { devWarn } from "../devWarn";
import { type FocusIndicator, useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import { touchControlMetrics } from "../touchMetrics";
import { useTouchSurface } from "../touchSurface";

import { linkName, NEW_TAB_NOTE, NewTabIndicator } from "./NewTabIndicator";

/**
 * The tones of a link button: the button tones of a control that moves to a
 * page. A link destroys nothing, so there is no `danger` tone, and a link sits
 * on an app surface, so there is no `onMedia` tone.
 */
export type LinkButtonTone = Extract<
  ButtonTone,
  "ghost" | "plain" | "primary" | "secondary"
>;

/**
 * The interaction state handed to a functional {@link LinkButtonProps} `style`.
 * `hovered` is web-only and stays false on native.
 */
export type LinkButtonStateStyleArgs = LinkInteractionState;

type LinkButtonBaseProps = {
  /** Spoken hint announced after the name. Native only. */
  accessibilityHint?: string;
  /** Stretch to fill the container width. */
  block?: boolean;
  /**
   * Marks the link to the page that shows now: `aria-current="page"` on web
   * and the selected state on native. The link holds the hover fill of its
   * tone at rest, so the current page shows.
   */
  current?: boolean;
  /**
   * How the link shows keyboard focus: the shared `ring` glow, the browser's
   * `outline`, or `none`. Defaults to the theme's `focusIndicator`.
   */
  focusIndicator?: FocusIndicator;
  /** The destination: a path of the app or an outside address. */
  href: string;
  /** Leading lucide icon, tinted to the label colour and hidden from assistive technology. */
  icon?: IconComponent;
  /** A leading node rendered as-is, taking precedence over `icon`. Decorative. */
  iconNode?: ReactNode;
  /** Extra style merged over the label, after the tone's colour. */
  labelStyle?: StyleProp<TextStyle>;
  /** Handle on the underlying link, for callers that drive focus themselves. */
  linkRef?: Ref<View>;
  /**
   * Open the destination in a new tab on web. The link then shows an arrow
   * after its label, and its name ends with
   * {@link LinkButtonBaseProps.newTabLabel}. Native has no tabs: an
   * activation runs `onNavigate`, or the platform's link handling without it.
   */
  newTab?: boolean;
  /** The note at the end of the name of a new-tab link. Defaults to "(opens in a new tab)". */
  newTabLabel?: string;
  /** Truncate the label to this many lines. */
  numberOfLines?: number;
  /**
   * The app's own navigation, for routing inside the app. On web, a primary
   * click or Enter without a modifier on a same-tab link runs it instead of
   * loading `href`; a modified or middle click, and every click of a new-tab
   * link, keep the browser's link behaviour. On native every activation runs
   * it.
   */
  onNavigate?: () => void;
  /** Container geometry, as on a button. Defaults to `rounded`. */
  shape?: ButtonShape;
  /** Control density, as on a button. Defaults to `md`. */
  size?: ControlSize;
  /**
   * Extra style for the link box, layered last. Pass a function to style by
   * interaction state.
   */
  style?:
    | StyleProp<ViewStyle>
    | ((state: LinkButtonStateStyleArgs) => StyleProp<ViewStyle>);
  /** Test identifier forwarded to the link (`data-testid` on web). */
  testID?: string;
  /** Visual emphasis. Defaults to `secondary`. */
  tone?: LinkButtonTone;
};

/** A link button with a visible label, which names it by default. */
export type LabelledLinkButtonProps = LinkButtonBaseProps & {
  /** Accessible name. Defaults to the visible label. */
  accessibilityLabel?: string;
  /** Visible label. */
  children: ReactNode;
};

/** An icon-only link button, which needs an accessible name. */
export type IconOnlyLinkButtonProps = LinkButtonBaseProps & {
  /** Accessible name. Required because there is no visible label. */
  accessibilityLabel: string;
  children?: never;
} & ({ icon: IconComponent } | { iconNode: ReactNode });

export type LinkButtonProps = IconOnlyLinkButtonProps | LabelledLinkButtonProps;

/**
 * A link with the look of the button of the same tone and size: the same
 * metrics at every size, the dense `xs` size and the touch metrics included,
 * the same hover and pressed washes, and the shared focus glow. On web it is
 * an anchor with its `href`, so the browser keeps its link behaviour. A link
 * has no disabled state; a control that cannot navigate yet is a disabled
 * button.
 */
export function LinkButton({
  accessibilityHint,
  accessibilityLabel,
  block = false,
  children,
  current = false,
  focusIndicator,
  href,
  icon,
  iconNode,
  labelStyle,
  linkRef,
  newTab = false,
  newTabLabel = NEW_TAB_NOTE,
  numberOfLines,
  onNavigate,
  shape = "rounded",
  size = "md",
  style,
  testID,
  tone = "secondary",
}: LinkButtonProps) {
  const theme = useSharedUiTheme();
  // On a touch surface the link draws the touch metrics, whatever its size.
  const touch = useTouchSurface();
  const styles = useMemo(
    () =>
      touch ? createTouchButtonStyles(theme) : createButtonStyles(theme, size),
    [theme, size, touch],
  );
  const focus = useFocusRing({ indicator: focusIndicator });
  const labelColor = buttonLabelColor(theme, tone);
  const shapeStyle = useMemo(
    () =>
      buttonShapeStyle({
        boxSize: undefined,
        minTouchTarget: undefined,
        shape,
        size,
        theme,
        touchFace: touch,
      }),
    [shape, size, theme, touch],
  );
  const iconSize = touch ? touchControlMetrics.iconSize : buttonIconSize(size);
  const hasVisibleLabel = children != null && children !== "";
  const name = linkName(accessibilityLabel, newTab, newTabLabel);

  if (!hasVisibleLabel && !accessibilityLabel) {
    // The type requires a name for an icon-only link; guard untyped callers.
    devWarn(
      "LinkButton: a link button with no visible text children must be " +
        "given an `accessibilityLabel` so assistive technology can name it.",
    );
  }

  return (
    <Link
      accessibilityHint={accessibilityHint}
      accessibilityLabel={name}
      current={current}
      href={href}
      newTab={newTab}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onNavigate={onNavigate}
      ref={linkRef}
      style={(state) => [
        ...buttonPaintLayers({
          block,
          busy: false,
          disabledState: false,
          // The current link holds the hover fill of its tone.
          hovered: state.hovered || current,
          inlineChip: false,
          pressed: state.pressed,
          shapeStyle,
          styles,
          tone,
        }),
        typeof style === "function" ? style(state) : style,
        focus.focusRingVariables,
      ]}
      testID={testID}
      {...focus.focusRingProps}
    >
      <ButtonContent
        color={labelColor}
        icon={icon}
        iconNode={iconNode}
        iconSize={iconSize}
        labelStyle={labelStyle}
        numberOfLines={numberOfLines}
        showSpinner={false}
        styles={styles}
      >
        {children}
      </ButtonContent>
      {newTab && hasVisibleLabel ? (
        <NewTabIndicator
          color={tone === "primary" ? labelColor : theme.colors.muted}
          note={name == null ? newTabLabel : undefined}
          size={iconSize}
        />
      ) : null}
    </Link>
  );
}
