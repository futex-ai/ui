import type { ReactNode } from "react";
import type { IconComponent } from "@firna/ui";
import { InputFrame } from "@firna/ui/input";
import { useSharedUiTheme } from "@firna/ui/theme";
import { ChevronDown, CircleX } from "lucide-react";

import { noop } from "../../noop";
import { classes } from "../common/classes";
import { focusGlow } from "../common/drawnState";
import { useControlMetrics, useSurface } from "../common/Surface";
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

/** The target of an action inside a dense desktop field, in px. */
const DESKTOP_FIELD_ACTION = 24;

/**
 * The clear action as a labelled suffix button whose box is the whole
 * target. The built-in clear button of `InputFrame` is only as large as its
 * icon on web, because the web backend ignores `hitSlop`.
 */
function clearAction(label: string, fieldPadding: number, target: number) {
  return {
    onSuffixIconPress: noop,
    suffixIcon: CircleX,
    suffixIconLabel: `Clear ${label}`,
    // The box reaches into the field padding, so the icon keeps its place.
    suffixIconStyle: {
      height: target,
      marginRight: -fieldPadding,
      width: target,
    },
  };
}

/**
 * The library `InputFrame` at the control size of its surface. On desktop
 * the box is 26 px with 13 px text, and the input fills it. On a phone the
 * input itself is the 44 px target, so the bordered box is 46 px, and the
 * 16 px text stops a phone browser from zooming into the field. A clear
 * action is a 44 px target on a phone and a 24 px target on desktop.
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
  const metrics = useControlMetrics();
  const phone = useSurface() === "phone";
  const inputHeight = phone ? metrics.height : metrics.height - 2;
  const actionTarget = phone ? metrics.height : DESKTOP_FIELD_ACTION;
  const clear =
    props.clearable && props.value !== ""
      ? clearAction(props.label, metrics.fieldPaddingX, actionTarget)
      : {};
  return (
    <InputFrame
      {...clear}
      accessibilityLabel={props.label}
      active={props.focused}
      inputStyle={{ fontSize: metrics.fieldText, height: inputHeight }}
      invalid={props.invalid}
      onChangeText={noop}
      placeholder={props.placeholder}
      prefixIcon={props.prefixIcon}
      size={phone ? "lg" : "sm"}
      style={[
        // The box sets a minimum height, so it can grow with text spacing.
        {
          minHeight: inputHeight + 2,
          paddingHorizontal: metrics.fieldPaddingX,
        },
        props.focused ? focusGlow(theme) : undefined,
      ]}
      value={props.value}
    />
  );
}

/** A closed selector field with the look of the library selector. */
export function Select(props: {
  label: string;
  value: string;
  disabled?: boolean;
}) {
  const metrics = useControlMetrics();
  return (
    <button
      aria-expanded="false"
      aria-haspopup="listbox"
      aria-label={`${props.label}, ${props.value}`}
      className={styles.select}
      disabled={props.disabled}
      type="button"
    >
      <span className={styles.value}>{props.value}</span>
      <ChevronDown
        aria-hidden
        className={styles.chevron}
        size={metrics.iconSize}
      />
    </button>
  );
}

/** A segmented control in the pill style of the library, at surface size. */
export function Segmented(props: {
  label: string;
  options: readonly string[];
  value: string;
}) {
  return (
    <div aria-label={props.label} className={styles.track} role="radiogroup">
      {props.options.map((option) => {
        const checked = option === props.value;
        return (
          <span
            aria-checked={checked}
            className={classes(styles.segment, checked && styles.checked)}
            key={option}
            role="radio"
            tabIndex={checked ? 0 : -1}
          >
            {option}
          </span>
        );
      })}
    </div>
  );
}
