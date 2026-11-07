import type { ReactElement } from "react";
import { MockLink } from "@mokly/mokly";
import type { IconComponent } from "@firna/ui";
import { Button, type ButtonTone } from "@firna/ui/button";
import { useSharedUiTheme } from "@firna/ui/theme";

import { noop } from "../../noop";
import { drawnButtonStyle, type DrawnState } from "../common/drawnState";
import { useControlMetrics, useSurface } from "../common/Surface";

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
 * A library `Button` at the size of its surface: the proposed `xs` metrics
 * on desktop, with the lighter label, and the 44 px touch size on a phone.
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
  const metrics = useControlMetrics();
  const phone = useSurface() === "phone";
  const tone = props.tone ?? "secondary";
  const state = props.state ?? "rest";
  return linked(
    <Button
      {...menuProps(props.menu, state)}
      block={props.block}
      busy={props.busy}
      disabled={props.disabled}
      icon={props.icon}
      labelStyle={{
        fontSize: metrics.labelSize,
        fontWeight: metrics.labelWeight,
        lineHeight: metrics.labelLine,
      }}
      numberOfLines={1}
      onPress={noop}
      size={phone ? "lg" : "sm"}
      style={[
        {
          gap: metrics.gap,
          height: metrics.height,
          paddingHorizontal: metrics.paddingX,
        },
        drawnButtonStyle(theme, tone, state),
      ]}
      tone={tone}
    >
      {props.children}
    </Button>,
    props.to,
  );
}

/**
 * An icon-only library `Button` whose box is the control height of its
 * surface: 26 px on desktop and 44 px on a phone. A quiet button draws a
 * muted glyph, for toolbars.
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
  const metrics = useControlMetrics();
  const phone = useSurface() === "phone";
  const tone = props.tone ?? "plain";
  const state = props.state ?? "rest";
  const Icon = props.icon;
  const glyph = (
    <Icon
      color={props.quiet ? theme.colors.muted : theme.colors.ink}
      size={metrics.iconSize + 1}
    />
  );
  const shared = {
    ...menuProps(props.menu, state),
    accessibilityLabel: props.label,
    boxSize: metrics.height,
    onPress: noop,
    shape: "square" as const,
    size: phone ? ("lg" as const) : ("sm" as const),
    style: drawnButtonStyle(theme, tone, state),
    tone,
  };
  const button =
    tone === "plain" ? (
      <Button {...shared} iconNode={glyph} />
    ) : (
      <Button {...shared} icon={props.icon} />
    );
  return linked(button, props.to);
}
