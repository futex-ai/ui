/**
 * A static list whose `ListItem` labels are pressable beside an independent
 * switch: the label opens the setting, and the switch toggles on its own.
 */
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { List, ListItem, Switch } from "../index";

type SettingRow = { detail: string; id: string; name: string };

const settingRows: SettingRow[] = [
  { detail: "Push, email, and in-app", id: "s1", name: "Notifications" },
  { detail: "Who can see your activity", id: "s2", name: "Visibility" },
  { detail: "Sync across your devices", id: "s3", name: "Backups" },
];

export function PressableLabelExample() {
  const [opened, setOpened] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    s1: true,
    s2: false,
    s3: true,
  });
  return (
    <View style={styles.stack}>
      <Text style={styles.status}>
        {opened
          ? `Opened ${opened}`
          : "The label opens the setting; the switch toggles independently"}
      </Text>
      <View style={styles.card}>
        {/* A static list (no `onItemPress`): each ListItem makes only its label
            column pressable, so the trailing Switch stays independently
            interactive in the same row. */}
        <List<SettingRow>
          accessibilityLabel="Settings"
          itemKey={(row) => row.id}
          items={settingRows}
          renderItem={(row) => (
            <ListItem
              description={row.detail}
              onPress={() => setOpened(row.name)}
              title={row.name}
              trailing={
                <Switch
                  accessibilityLabel={`Enable ${row.name}`}
                  onValueChange={(next) =>
                    setEnabled((prev) => ({ ...prev, [row.id]: next }))
                  }
                  value={enabled[row.id] ?? false}
                />
              }
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    width: 520,
  },
  stack: { gap: 12 },
  status: {
    color: "#3e4540",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
});
