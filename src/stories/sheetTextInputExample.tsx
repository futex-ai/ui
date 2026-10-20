/** A sheet that edits text: `SheetTextInput`, a visible dismiss label, and a title. */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "../primitives/reactNative";

import { Sheet, SheetTextInput, useSharedUiTheme } from "../index";
import type { SharedUiTheme } from "../index";

/**
 * The sheet is named "Rename tag" for assistive tech while its visible title
 * reads "Tag name". Its dismiss label shows as a visible "Done" button on both
 * platforms. On native, `SheetTextInput` keeps the sheet above the keyboard.
 */
export function SheetTextInputExample() {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Flat 2, 14 Brook Street");
  return (
    <View style={styles.example}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Rename tag</Text>
      </Pressable>
      <Text style={styles.value}>{name}</Text>
      <Sheet
        dismissLabel="Done"
        label="Rename tag"
        onClose={() => setOpen(false)}
        open={open}
        title="Tag name"
      >
        <SheetTextInput
          accessibilityLabel="Tag name"
          onChangeText={setName}
          placeholderTextColor={theme.colors.placeholder}
          style={styles.input}
          value={name}
        />
      </Sheet>
    </View>
  );
}

function createStyles(theme: SharedUiTheme) {
  return StyleSheet.create({
    button: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.primaryDeep,
      borderRadius: theme.radii.md,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    buttonText: {
      color: theme.colors.onSolid,
      fontFamily: theme.fonts.sans,
      fontSize: 14,
      fontWeight: "700",
    },
    example: { gap: 12, minWidth: 320 },
    input: {
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      color: theme.colors.ink,
      fontFamily: theme.fonts.sans,
      fontSize: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    value: {
      color: theme.colors.ink2,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
    },
  });
}
