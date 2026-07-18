/** An info (ⓘ) button after a field label that reveals help text in a tooltip. */
import { Info, LucideIcon } from "lucide-react-native";
import { useId, useMemo } from "react";
import { Platform, Pressable, Text } from "react-native";

import { hideWebOutlineView, useFocusRing } from "../focusRing";
import { Popover } from "../popover";
import { useSharedUiTheme } from "../theme";

import { createInputStyles } from "./inputStyles";

/**
 * Fixed icon diameter for the info button. The label row keeps a constant scale
 * across `sm` / `md` / `lg` (like the label, hint, and error text), so the ⓘ
 * does not grow with the control density.
 */
const LABEL_INFO_ICON_SIZE = 14;

export type LabelInfoProps = {
  /** Explanatory text revealed in the tooltip when the button is pressed. */
  info: string;
  /** Icon component for the button. Defaults to the lucide `Info` glyph. */
  icon?: LucideIcon;
  /** Accessible name for the button, e.g. `More information about Email`. */
  accessibilityLabel: string;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/**
 * A press-triggered ⓘ button that sits after a field label and reveals
 * supplementary help text.
 *
 * The button carries the detail as its own accessible description, so assistive
 * tech announces it whenever the button is focused (WCAG 2.1 1.3.1 / 4.1.2):
 * native reads `accessibilityHint`; the web build — where RNW does NOT map
 * `accessibilityHint` — is wired with a literal `aria-describedby` pointing at a
 * visually-hidden copy of the text. The button also has an accessible name
 * (4.1.2) and its own focus ring (2.4.7).
 *
 * The visible bubble is built on {@link Popover} purely as a *sighted-user*
 * reveal: it is portaled (so it escapes `overflow` clipping inside modals and
 * scroll areas) and dismisses on outside-press / Escape, but it does not steal
 * focus and its content is `aria-hidden` — the text is never announced twice,
 * and the button reads as a plain button, not a menu/disclosure.
 */
export function LabelInfo({
  info,
  icon: Icon = Info,
  accessibilityLabel,
  testID,
}: LabelInfoProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createInputStyles(theme), [theme]);
  const focus = useFocusRing();
  const descriptionId = useId();
  const isWeb = Platform.OS === "web";
  return (
    <Popover
      gutter={6}
      // Sighted-only reveal: the accessible copy lives on the button, so the
      // bubble must not steal focus (WCAG 2.4.3) or re-announce the text.
      manageFocus={false}
      minWidth={200}
      style={styles.labelInfoAnchor}
      testID={testID}
      trigger={({ toggle }) => (
        <Pressable
          accessibilityHint={info}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          aria-describedby={isWeb ? descriptionId : undefined}
          hitSlop={8}
          onBlur={focus.onBlur}
          onFocus={focus.onFocus}
          onPress={toggle}
          style={[
            styles.labelInfoButton,
            hideWebOutlineView,
            focus.focused ? focus.focusRingStyle : null,
          ]}
        >
          <Icon color={theme.colors.muted} size={LABEL_INFO_ICON_SIZE} />
          {/* Web `aria-describedby` target: a visually-hidden copy of the text,
              since the portaled bubble is not a reliable description source. */}
          {isWeb ? (
            <Text nativeID={descriptionId} style={styles.labelInfoDescription}>
              {info}
            </Text>
          ) : null}
        </Pressable>
      )}
    >
      <Text aria-hidden style={styles.labelInfoText}>
        {info}
      </Text>
    </Popover>
  );
}
