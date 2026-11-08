/**
 * Examples of the phone menu sheet: the interactive sheet that the menus open
 * on a touch surface, and the sheet drawn in place for static HTML.
 */
import { useRef, useState } from "react";
import { ArrowDownAZ, MoreHorizontal } from "../primitives/icons";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { Button, InlineMenu, InlineMenuSheet, ResponsiveMenu } from "../index";
import { TouchSurface } from "../touchSurface";

import {
  MenuLogText,
  projectActions,
  sortChoices,
  useMenuLog,
} from "./menuExamples";

/**
 * A phone layout. On the touch surface the in-place menu and the responsive
 * menu both open the menu sheet: touch rows, a 44px close control, and no
 * active row until an arrow key moves one.
 */
export function MenuSheetExample() {
  const actions = useMenuLog();
  const sort = useMenuLog();
  const [order, setOrder] = useState("Recent activity");
  const sortTriggerRef = useRef<View>(null);
  return (
    <TouchSurface>
      <View style={styles.phone}>
        <View style={styles.toolbar}>
          <InlineMenu
            entries={projectActions(actions.run)}
            label="Project actions"
            onClose={actions.onClose}
            open={actions.open}
            size="xs"
            title="Billing portal"
          >
            <Button
              accessibilityLabel="Project actions"
              expanded={actions.open}
              hasPopup="menu"
              icon={MoreHorizontal}
              onPress={actions.toggle}
              shape="square"
              size="xs"
              tone="ghost"
            />
          </InlineMenu>
          <View ref={sortTriggerRef}>
            <Button
              accessibilityLabel="Sort projects"
              expanded={sort.open}
              hasPopup="menu"
              icon={ArrowDownAZ}
              onPress={sort.toggle}
              shape="square"
              size="xs"
              tone="ghost"
            />
          </View>
          <ResponsiveMenu
            anchorRef={sortTriggerRef}
            entries={sortChoices(order, (label) => {
              setOrder(label);
              sort.run(label);
            })}
            label="Sort projects"
            maxHeight={360}
            onClose={sort.onClose}
            open={sort.open}
            size="xs"
          />
        </View>
        <MenuLogText log={actions.log} />
        <Text style={styles.status}>{`Sort: ${order}`}</Text>
        <MenuLogText log={sort.log} />
      </View>
    </TouchSurface>
  );
}

const noop = () => undefined;

/**
 * The phone menu sheet drawn open in place over a phone layout, as static and
 * server-rendered HTML shows it: no portal and no script needed.
 */
export function StaticMenuSheetExample() {
  return (
    <TouchSurface>
      <View style={styles.frame}>
        <View style={styles.page}>
          <Text style={styles.heading}>Billing portal</Text>
          <Text style={styles.status}>acme/billing-portal</Text>
        </View>
        <InlineMenuSheet
          entries={projectActions(noop)}
          label="Project actions"
          onClose={noop}
          size="xs"
          title="Billing portal"
        />
      </View>
    </TouchSurface>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderColor: "rgba(28, 31, 29, 0.12)",
    borderRadius: 12,
    borderWidth: 1,
    height: 560,
    overflow: "hidden",
    width: 360,
  },
  heading: { color: "#1f2a24", fontSize: 18, fontWeight: "700" },
  page: { gap: 4, padding: 16 },
  phone: { gap: 12, maxWidth: 360, width: "100%" },
  status: { color: "#4b5450", fontSize: 13, lineHeight: 18 },
  toolbar: { alignItems: "center", flexDirection: "row", gap: 8 },
});
