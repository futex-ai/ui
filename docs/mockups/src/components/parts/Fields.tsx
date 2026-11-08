import type { ReactNode } from "react";
import type { IconComponent } from "@firna/ui";
import { DropdownSelector } from "@firna/ui/dropdown";
import { InputFrame } from "@firna/ui/input";
import { SegmentedControl } from "@firna/ui/segmented";
import { useSharedUiTheme } from "@firna/ui/theme";

import { noop } from "../../noop";
import { focusGlow } from "../common/drawnState";
import styles from "./Fields.module.css";

/**
 * A labelled form row. Desktop puts the label beside the control, and a
 * phone puts it above. An error replaces the hint.
 */
export function Field(props: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{props.label}</span>
      <div className={styles.control}>
        {props.children}
        {props.error ? (
          <p className={styles.error}>{props.error}</p>
        ) : props.hint ? (
          <p className={styles.hint}>{props.hint}</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The library `InputFrame` at the `xs` size: a 26 px box around a 24 px
 * input with 13 px text. On a phone the touch surface makes the input itself
 * a 44 px target with 16 px text. The built-in clear action is a 24 px target
 * on desktop and a 44 px target on a phone.
 */
export function TextField(props: {
  label: string;
  value: string;
  placeholder?: string;
  prefixIcon?: IconComponent;
  invalid?: boolean;
  focused?: boolean;
  /** Shows a clear action while the field has a value. */
  clearable?: boolean;
}) {
  const theme = useSharedUiTheme();
  return (
    <InputFrame
      accessibilityLabel={props.label}
      active={props.focused}
      clearable={props.clearable}
      invalid={props.invalid}
      onChangeText={noop}
      onClear={noop}
      placeholder={props.placeholder}
      prefixIcon={props.prefixIcon}
      size="xs"
      style={props.focused ? focusGlow(theme) : undefined}
      value={props.value}
    />
  );
}

/**
 * A closed library `DropdownSelector` at the `xs` size. The form row shows
 * the label, so the trigger takes its name from the label and the value.
 */
export function Select(props: { label: string; value: string }) {
  return (
    <DropdownSelector
      onValueChange={noop}
      options={[{ label: props.value, value: props.value }]}
      size="xs"
      triggerLabel={`${props.label}, ${props.value}`}
      value={props.value}
    />
  );
}

/** A library `SegmentedControl` at the `xs` size, in its pill style. */
export function Segmented(props: {
  label: string;
  options: readonly string[];
  value: string;
}) {
  return (
    <SegmentedControl
      accessibilityLabel={props.label}
      onChange={noop}
      options={props.options.map((option) => ({
        label: option,
        value: option,
      }))}
      size="xs"
      value={props.value}
    />
  );
}
