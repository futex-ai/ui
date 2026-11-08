import type { ReactElement } from "react";
import { MockLink } from "@mokly/mokly";
import type { IconComponent } from "@firna/ui";
import { Button, type ButtonTone } from "@firna/ui/button";
import { useSharedUiTheme } from "@firna/ui/theme";

import { noop } from "../../noop";
import { drawnButtonStyle, type DrawnState } from "../common/drawnState";
import { useGlyphSize } from "../common/Surface";

/** Makes a control the link to another screen when it has a destination. */
function linked(control: ReactElement, to: string | undefined) {
  if (!to) return control;
  return (
    <MockLink asChild to={to}>
      {control}
    </MockLink>
  );
}

/** The menu semantics of a trigger: it opens a menu, open or closed. */
function menuProps(menu: boolean | undefined, state: DrawnState) {
  if (!menu) return {};
  return { expanded: state === "open", hasPopup: "menu" as const };
}

/**
 * A library `Button` at the dense `xs` size. On a phone the touch surface
 * gives it the touch metrics: a 44 px target with a 15 px label.
 */
export function ActionButton(props: {
  children: string;
  icon?: IconComponent;
  tone?: ButtonTone;
  busy?: boolean;
  disabled?: boolean;
  block?: boolean;
  /** The button opens a menu. */
  menu?: boolean;
  state?: DrawnState;
  /** The screen that the press leads to. */
  to?: string;
}) {
  const theme = useSharedUiTheme();
  const tone = props.tone ?? "secondary";
  const state = props.state ?? "rest";
  return linked(
    <Button
      {...menuProps(props.menu, state)}
      block={props.block}
      busy={props.busy}
      disabled={props.disabled}
      icon={props.icon}
      numberOfLines={1}
      onPress={noop}
      size="xs"
      style={drawnButtonStyle(theme, tone, state)}
      tone={tone}
    >
      {props.children}
    </Button>,
    props.to,
  );
}

/**
 * An icon-only library `Button` at the `xs` size: 26 px on desktop and a
 * 44 px target on a phone. A quiet button draws a muted glyph, for toolbars.
 */
export function IconAction(props: {
  label: string;
  icon: IconComponent;
  tone?: ButtonTone;
  quiet?: boolean;
  menu?: boolean;
  state?: DrawnState;
  to?: string;
}) {
  const theme = useSharedUiTheme();
  const glyphSize = useGlyphSize();
  const tone = props.tone ?? "plain";
  const state = props.state ?? "rest";
  const Icon = props.icon;
  const shared = {
    ...menuProps(props.menu, state),
    accessibilityLabel: props.label,
    onPress: noop,
    shape: "square" as const,
    size: "xs" as const,
    style: drawnButtonStyle(theme, tone, state),
    tone,
  };
  const button = props.quiet ? (
    <Button
      {...shared}
      iconNode={<Icon color={theme.colors.muted} size={glyphSize} />}
    />
  ) : (
    <Button {...shared} icon={props.icon} />
  );
  return linked(button, props.to);
}
