/** Titled radio-option cards for larger one-of-N choices. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode, RefObject } from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { hideWebOutlineView, useFocusRing } from "../focusRing";
import {
  focusItemAt,
  type FocusableRef,
  nextNavIndex,
  rovingTabIndex,
} from "../keyboardNavigation";
import { useSharedUiTheme } from "../theme";

import { createRadioCardStyles } from "./radioCardStyles";

type RadioCardKeyboardEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export type RadioCardProps = {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  body?: string;
  checked?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  title: string;
};

export function RadioCard({
  accessibilityHint,
  accessibilityLabel,
  body,
  checked = false,
  disabled = false,
  onPress,
  style,
  title,
}: RadioCardProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createRadioCardStyles(theme), [theme]);
  const focus = useFocusRing();
  const disabledState = disabled || !onPress;

  // A `RadioCardGroup` ancestor wires arrow-key navigation and a single
  // roving Tab stop; a standalone card falls back to being individually
  // tabbable (its own Space activation still works).
  const group = useContext(RadioCardGroupContext);
  const inGroup = group !== null;
  const cardId = useId();
  const cardRef = useRef<FocusableRef>(null);

  // Register against the group's stable callbacks, not the whole context value:
  // the context object is recreated whenever the group's `version`/`activeIndex`
  // changes (e.g. on every registration), so depending on `group` here would
  // re-run register → bump version → recreate context → re-run register, an
  // infinite update loop.
  const register = group?.register;
  const unregister = group?.unregister;
  useEffect(() => {
    if (!register || !unregister) {
      return;
    }
    register(cardId, cardRef, disabledState);
    return () => unregister(cardId);
  }, [register, unregister, cardId, disabledState]);

  const index = group ? group.indexOf(cardId) : -1;
  const tabIndex = inGroup ? rovingTabIndex(index, group!.activeIndex) : 0;

  const handleKeyDown = (event: RadioCardKeyboardEvent) => {
    const key = event.nativeEvent?.key ?? event.key;
    if (disabledState) {
      return;
    }
    if (inGroup && key) {
      const handled = group!.handleArrowKey(key, cardId);
      if (handled) {
        event.preventDefault?.();
        event.stopPropagation?.();
        return;
      }
    }
    if (key !== " " && key !== "Spacebar") {
      return;
    }
    event.preventDefault?.();
    event.stopPropagation?.();
    onPress?.();
  };

  const keyProps = Platform.OS === "web" ? { onKeyDown: handleKeyDown } : {};

  const handleFocus = () => {
    focus.onFocus();
    // Keep the single roving Tab stop on whichever card actually has focus,
    // however focus arrived (Tab, click, or arrow-key movement).
    if (inGroup && !disabledState) {
      group!.setActive(cardId);
    }
  };

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled: disabledState }}
      aria-checked={checked}
      disabled={disabledState}
      onBlur={focus.onBlur}
      onFocus={handleFocus}
      onPress={onPress}
      ref={(node) => {
        cardRef.current = node as unknown as FocusableRef;
      }}
      tabIndex={tabIndex}
      {...keyProps}
      style={[
        styles.radio,
        checked ? styles.radioChecked : null,
        disabledState ? styles.radioDisabled : null,
        style,
        // The focus ring is applied AFTER the consumer `style` so a passed
        // style can't clobber the keyboard-focus indicator, and it is a
        // geometry-bearing outline (not just a border recolor) so it stays
        // visible on a checked card whose border is already `primary`
        // (WCAG 2.1 — 2.4.7 Focus Visible, AA).
        focus.focused ? focus.focusRingStyle : null,
        hideWebOutlineView,
      ]}
    >
      <View style={styles.radioDotCol}>
        <View
          style={[styles.radioDot, checked ? styles.radioDotChecked : null]}
        >
          {/* Non-color selection affordance: a check glyph distinguishes the
              checked state from the empty ring without relying on color
              (WCAG 2.1 — 1.4.1 Use of Color, A). State itself is exposed via
              `aria-checked`, so the glyph is hidden from assistive tech. */}
          {checked ? (
            <Text
              aria-hidden
              importantForAccessibility="no"
              style={styles.radioCheckGlyph}
            >
              {"✓"}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.radioText}>
        <Text style={styles.radioTitle}>{title}</Text>
        {body ? <Text style={styles.radioBody}>{body}</Text> : null}
      </View>
    </Pressable>
  );
}

type RadioCardGroupContextValue = {
  activeIndex: number;
  /** Bumps whenever the registered card set changes, to re-resolve indices. */
  version: number;
  /** Registers a card's focusable ref + disabled state under a stable id. */
  register: (
    id: string,
    ref: RefObject<FocusableRef>,
    disabled: boolean,
  ) => void;
  /** Removes a card on unmount. */
  unregister: (id: string) => void;
  /** Resolves the registration order index for a card id (-1 if unknown). */
  indexOf: (id: string) => number;
  /** Makes the card the roving Tab stop (called when it receives focus). */
  setActive: (id: string) => void;
  /**
   * Handles an arrow / Home / End key from the card `id`. Returns true when
   * the key moved roving focus (so the caller swallows the event).
   */
  handleArrowKey: (key: string, id: string) => boolean;
};

const RadioCardGroupContext = createContext<RadioCardGroupContextValue | null>(
  null,
);

export type RadioCardGroupProps = {
  accessibilityLabel?: string;
  children: ReactNode;
  /** Marks the group invalid for assistive tech (→ `aria-invalid`). */
  invalid?: boolean;
  /** Visible group label; doubles as the accessible name when set. */
  label?: string;
  /** Marks the group required for assistive tech (→ `aria-required`). */
  required?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Owns a set of {@link RadioCard}s as a single `radiogroup`.
 *
 * A lone `role=radio` with no owning group is an incomplete ARIA pattern: the
 * group must advertise `radiogroup` and behave as one Tab stop with arrow keys
 * roving selection between options (WCAG 2.1 — 4.1.2 Name/Role/Value, A; 2.1.1
 * Keyboard, A; 1.3.1 Info and Relationships, A; WAI-ARIA APG radio pattern).
 * The group tracks which card is the roving Tab stop and moves DOM focus on
 * arrow keys; each card keeps its own Space activation.
 */
export function RadioCardGroup({
  accessibilityLabel,
  children,
  invalid = false,
  label,
  required = false,
  style,
}: RadioCardGroupProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createRadioCardStyles(theme), [theme]);

  // Ids in mount order; the active (roving-tabbable) card defaults to the
  // first enabled card and then follows keyboard focus.
  const orderRef = useRef<string[]>([]);
  const refsRef = useRef<Map<string, RefObject<FocusableRef>>>(new Map());
  const disabledRef = useRef<Map<string, boolean>>(new Map());
  // `null` means "default to the first enabled card", resolved at read time so
  // it survives the disabled card mounting first.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // Cards register in a post-mount effect, so bump a version on registration
  // to re-render consumers and re-resolve their roving `tabIndex`.
  const [version, setVersion] = useState(0);

  const register = useCallback(
    (id: string, ref: RefObject<FocusableRef>, disabled: boolean) => {
      refsRef.current.set(id, ref);
      disabledRef.current.set(id, disabled);
      if (!orderRef.current.includes(id)) {
        orderRef.current.push(id);
      }
      setVersion((value) => value + 1);
    },
    [],
  );

  const unregister = useCallback((id: string) => {
    refsRef.current.delete(id);
    disabledRef.current.delete(id);
    orderRef.current = orderRef.current.filter((entry) => entry !== id);
    setVersion((value) => value + 1);
  }, []);

  const indexOf = useCallback((id: string) => {
    return orderRef.current.indexOf(id);
  }, []);

  const setActive = useCallback((id: string) => {
    const i = orderRef.current.indexOf(id);
    if (i !== -1) {
      setActiveIndex(i);
    }
  }, []);

  // The single tabbable card: the explicit active one, or the first enabled.
  const resolvedActiveIndex = useMemo(() => {
    const order = orderRef.current;
    if (activeIndex !== null) {
      return activeIndex;
    }
    const firstEnabled = order.findIndex(
      (entry) => disabledRef.current.get(entry) !== true,
    );
    return firstEnabled === -1 ? 0 : firstEnabled;
    // `version` re-resolves once cards register their disabled state.
  }, [activeIndex, version]);

  const handleArrowKey = useCallback((key: string, id: string): boolean => {
    const order = orderRef.current;
    const count = order.length;
    const from = order.indexOf(id);
    if (from === -1 || count === 0) {
      return false;
    }
    // Step until we land on an enabled card, so a disabled card never becomes
    // the roving Tab stop (a disabled DOM node can't receive focus).
    let next = nextNavIndex({
      key,
      index: from,
      count,
      orientation: "vertical",
    });
    if (next === null) {
      return false;
    }
    let guard = 0;
    while (
      disabledRef.current.get(order[next]) === true &&
      next !== from &&
      guard < count
    ) {
      const stepped = nextNavIndex({
        key,
        index: next,
        count,
        orientation: "vertical",
      });
      if (stepped === null) {
        break;
      }
      next = stepped;
      guard += 1;
    }
    if (disabledRef.current.get(order[next]) === true) {
      return false;
    }
    setActiveIndex(next);
    const refs = order.map((entry) => refsRef.current.get(entry) ?? null);
    focusItemAt(refs, next);
    return true;
  }, []);

  const contextValue = useMemo<RadioCardGroupContextValue>(
    () => ({
      activeIndex: resolvedActiveIndex,
      version,
      register,
      unregister,
      indexOf,
      setActive,
      handleArrowKey,
    }),
    [
      resolvedActiveIndex,
      version,
      register,
      unregister,
      indexOf,
      setActive,
      handleArrowKey,
    ],
  );

  return (
    <RadioCardGroupContext.Provider value={contextValue}>
      <View
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="radiogroup"
        aria-invalid={invalid}
        aria-required={required}
        style={[styles.group, style]}
      >
        {label ? <Text style={styles.radioTitle}>{label}</Text> : null}
        {children}
      </View>
    </RadioCardGroupContext.Provider>
  );
}
