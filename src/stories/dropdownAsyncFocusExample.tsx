/** Consumer-shaped async form focus regression fixture for Storybook. */
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  DropdownSelector,
  Input,
  SkeletonBar,
  SkeletonGroup,
  WebModalFrame,
  useSharedUiTheme,
} from "../index";

const HYDRATION_DELAY_MS = 1_500;
const monthOptions = [
  { label: "January", value: "january" },
  { label: "April", value: "april" },
  { label: "July", value: "july" },
  { label: "October", value: "october" },
];

/**
 * Mirrors a modal form whose initial skeleton is replaced after data hydration.
 * The modal's one-time focus pass cannot see the selector during loading, so
 * the form explicitly focuses its first real field when hydration completes.
 */
export function DropdownAsyncFocusExample() {
  const [allowance, setAllowance] = useState("28");
  const [hydrated, setHydrated] = useState(false);
  const [month, setMonth] = useState("april");
  const [visible, setVisible] = useState(true);
  const monthTriggerRef = useRef<View | null>(null);
  const theme = useSharedUiTheme();

  useEffect(() => {
    const timeout = setTimeout(() => setHydrated(true), HYDRATION_DELAY_MS);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (hydrated && visible) {
      monthTriggerRef.current?.focus();
    }
  }, [hydrated, visible]);

  return (
    <WebModalFrame
      initialFocusRef={monthTriggerRef}
      onClose={() => setVisible(false)}
      size="sm"
      title="Holiday rules"
      visible={visible}
    >
      {hydrated ? (
        <View style={styles.form}>
          <DropdownSelector
            label="Holiday year starts"
            onValueChange={setMonth}
            options={monthOptions}
            triggerRef={monthTriggerRef}
            value={month}
          />
          <Input
            keyboardType="decimal-pad"
            label="Annual allowance"
            onChangeText={setAllowance}
            value={allowance}
          />
        </View>
      ) : (
        <View
          accessibilityState={{ busy: true }}
          style={styles.loading}
          testID="async-selector-skeleton"
        >
          <Text style={[styles.loadingLabel, { color: theme.colors.muted }]}>
            Loading holiday rules…
          </Text>
          <SkeletonGroup direction="column" gap={12}>
            <SkeletonBar height={18} width="42%" />
            <SkeletonBar height={40} radius="md" />
            <SkeletonBar height={18} width="36%" />
            <SkeletonBar height={40} radius="md" />
          </SkeletonGroup>
        </View>
      )}
    </WebModalFrame>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, minWidth: 320 },
  loading: { gap: 12, minWidth: 320 },
  loadingLabel: { fontSize: 13, lineHeight: 20 },
});
