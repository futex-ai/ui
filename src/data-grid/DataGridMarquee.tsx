/** The drag-selection marquee: a primary-bordered box over the selected cells. */
import { View } from "react-native";

import type { DataGridStyles } from "./dataGridStyles";
import type { DataGridDragBox } from "./useDataGridDrag";

export function DataGridMarquee({
  box,
  styles,
}: {
  box: DataGridDragBox | null;
  styles: DataGridStyles;
}) {
  if (!box) {
    return null;
  }
  return (
    <View
      pointerEvents="none"
      style={[
        styles.marquee,
        { left: box.left, top: box.top, width: box.width, height: box.height },
      ]}
      testID="data-grid-marquee"
    />
  );
}
