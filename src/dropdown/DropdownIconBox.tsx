/** The tinted icon box that leads an action-menu row. */
import type { IconComponent } from "../primitives/icons";
import { useMemo } from "react";
import { View } from "../primitives/reactNative";

import { useSharedUiTheme } from "../theme";

import { createDropdownListStyles } from "./dropdownListStyles";

export function DropdownIconBox({
  Icon,
  testID,
  tone = "sage",
}: {
  Icon: IconComponent;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  tone?: "danger" | "sage";
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createDropdownListStyles(theme), [theme]);
  const color =
    tone === "danger" ? theme.colors.rose : theme.colors.primaryDeep;
  return (
    <View
      style={[styles.iconBox, tone === "danger" ? styles.iconBoxDanger : null]}
      testID={testID}
    >
      <Icon color={color} size={14} />
    </View>
  );
}
