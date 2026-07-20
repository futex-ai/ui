import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Public components forward a caller-supplied `testID` to the outermost host
 * element they render (react-native-web maps `testID` -> `data-testid`; native
 * keeps the RN `testID`). This guards that contract across the whole library so
 * a regression that drops a forward is caught here rather than in a consumer's
 * end-to-end test.
 *
 * Each file below owns at least one exported component whose root(s) forward
 * `testID={testID}` (AnimatedBorder additionally keeps a `?? "animated-border"`
 * default). The list is exhaustive on purpose: adding a new public component
 * means adding it here.
 */
const FORWARDING_FILES = [
  "animated-border/AnimatedBorder.tsx",
  "avatar/Avatar.tsx",
  "badge/Badge.tsx",
  "button/Button.tsx",
  "button/ButtonSpinner.tsx",
  "calendar/AgendaView.tsx",
  "calendar/CalendarToolbar.tsx",
  "calendar/CalendarView.tsx",
  "calendar/DayView.tsx",
  "calendar/MonthView.tsx",
  "calendar/TimeGrid.tsx",
  "calendar/WeekView.tsx",
  "data-grid/DataGrid.tsx",
  "date/CalendarMonth.tsx",
  "date/DateField.tsx",
  "date/DatePickerOverlay.tsx",
  "date/DatePickerOverlay.web.tsx",
  "date/DateRangeField.tsx",
  "date/DateTrigger.tsx",
  "date/DateWheel.tsx",
  "drag-select/DragSelectableProvider.tsx",
  "drag-select/DragSelectableProvider.web.tsx",
  "dropdown/ComboboxMultiSelect.tsx",
  "dropdown/ComboboxPopover.tsx",
  "dropdown/ComboboxPopover.web.tsx",
  "dropdown/DropdownList.tsx",
  "dropdown/DropdownMenu.tsx",
  "dropdown/DropdownPortal.tsx",
  "dropdown/DropdownPortal.web.tsx",
  "dropdown/DropdownSelector.tsx",
  "dropdown/DropdownWebLayer.tsx",
  "heatmap/Heatmap.tsx",
  "input/LabelInfo.tsx",
  "kanban/Kanban.tsx",
  "kanban/KanbanCard.tsx",
  "kanban/KanbanChip.tsx",
  "list/List.tsx",
  "list/ListItem.tsx",
  "modal/WebModalFrame.tsx",
  "modal/WebModalFrame.web.tsx",
  "popover/Popover.tsx",
  "popover/PopoverSurface.tsx",
  "popover/PopoverSurface.web.tsx",
  "popover/ResponsivePopover.tsx",
  "popover/ResponsivePopover.web.tsx",
  "radio/RadioCard.tsx",
  "segmented/SegmentedControl.tsx",
  "sheet/BottomSheetShell.tsx",
  "sheet/Sheet.tsx",
  "sheet/Sheet.web.tsx",
  "skeleton/Skeleton.tsx",
  "sortable-list/SortableList.tsx",
  "spinner/Spinner.tsx",
  "switch/Switch.tsx",
  "table/Table.tsx",
  "toast/Toast.tsx",
  "toast/ToastLiveRegion.tsx",
  "toast/ToastViewport.tsx",
  "toast/ToastViewport.web.tsx",
  "typography/Typography.tsx",
  "workflow/WorkflowBuilder.tsx",
  "workflow/WorkflowEdge.tsx",
  "workflow/WorkflowNode.tsx",
] as const;

test("every public component file forwards a caller testID to a host root", () => {
  for (const file of FORWARDING_FILES) {
    const source = readSource(`../../src/${file}`);
    // `testID={testID}` on a host element, or the AnimatedBorder default form
    // `testID={testID ?? "animated-border"}`.
    assert.match(
      source,
      /testID=\{testID(\s*\?\?\s*"[^"]+")?\}/,
      `${file} should forward testID={testID} to its root host element`,
    );
  }
});

test("forwarding components declare an optional testID prop", () => {
  // The prop is declared in the component file itself unless it lives in a
  // shared props type in the same directory (platform-split components).
  const sharedTypeFiles: Record<string, string> = {
    "date/DatePickerOverlay.tsx": "date/types.ts",
    "date/DatePickerOverlay.web.tsx": "date/types.ts",
    "drag-select/DragSelectableProvider.tsx":
      "drag-select/dragSelectableTypes.ts",
    "drag-select/DragSelectableProvider.web.tsx":
      "drag-select/dragSelectableTypes.ts",
    "dropdown/DropdownPortal.tsx": "dropdown/dropdownPortalModel.ts",
    "dropdown/DropdownPortal.web.tsx": "dropdown/dropdownPortalModel.ts",
    "modal/WebModalFrame.tsx": "modal/types.ts",
    "modal/WebModalFrame.web.tsx": "modal/types.ts",
    "popover/ResponsivePopover.tsx": "popover/responsivePopoverModel.ts",
    "popover/ResponsivePopover.web.tsx": "popover/responsivePopoverModel.ts",
    "sheet/Sheet.tsx": "sheet/types.ts",
    "sheet/Sheet.web.tsx": "sheet/types.ts",
  };
  for (const file of FORWARDING_FILES) {
    const own = readSource(`../../src/${file}`);
    const declaresLocally = /testID\?: string;/.test(own);
    const shared = sharedTypeFiles[file];
    const declaresInShared = shared
      ? /testID\?: string;/.test(readSource(`../../src/${shared}`))
      : false;
    assert.ok(
      declaresLocally || declaresInShared,
      `${file} should declare \`testID?: string\` (here or in ${shared ?? "a shared type"})`,
    );
  }
});

test("input family forwards testID through the spread onto the TextInput", () => {
  // InputFrame extends TextInputProps and spreads the rest onto the TextInput,
  // so `testID` reaches the input host without an explicit prop; Input and
  // Textarea pass it straight through. No duplicate testID prop is added.
  const frame = readSource("../../src/input/InputFrame.tsx");
  assert.match(frame, /Omit<TextInputProps/);
  assert.match(frame, /\.\.\.props/);
  const textarea = readSource("../../src/input/Textarea.tsx");
  assert.match(textarea, /\.\.\.props/);
});

test("typography heading wrappers forward testID through to the base Text", () => {
  const source = readSource("../../src/typography/Typography.tsx");
  // The base Text forwards testID to RNText, and the H1..Overline wrappers
  // spread {...props} into <Text>, so testID flows through them.
  assert.match(source, /testID=\{testID\}/);
  assert.match(source, /return <Text variant="h1" \{\.\.\.props\} \/>;/);
});

test("AnimatedBorder keeps its default testID while allowing a caller override", () => {
  const source = readSource("../../src/animated-border/AnimatedBorder.tsx");
  // A caller testID overrides on the no-children root; the "animated-border"
  // default remains so existing selectors keep working.
  assert.match(source, /testID=\{testID \?\? "animated-border"\}/);
  assert.match(source, /testID="animated-border"/);
});

test("SegmentedControl forwards testID on its root without disturbing the thumb", () => {
  const source = readSource("../../src/segmented/SegmentedControl.tsx");
  assert.match(source, /<View style=\{styles\.field\} testID=\{testID\}>/);
  // The internal thumb keeps its own functional testID.
  assert.match(source, /testID="segmentedThumb"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
