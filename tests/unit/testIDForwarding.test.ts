import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Public components forward a caller-supplied `testID` to a host element
 * (react-native-web maps `testID` -> `data-testid`; native keeps the RN
 * `testID`). This is normally the outermost root; an interactive component can
 * instead target the host that owns its handler so test presses reach it. This
 * guards the forwarding contract across the whole library so a regression that
 * drops a forward is caught here rather than in a consumer's end-to-end test.
 *
 * Each file below owns at least one exported component whose host target
 * forwards `testID={testID}` (AnimatedBorder additionally keeps a
 * `?? "animated-border"` default). The list is exhaustive on purpose: adding a
 * new public component means adding it here.
 *
 * The one deliberate omission is `sortable-list/SortableGroups.tsx`: the
 * coordinator renders only a context provider around its children, so it has no
 * host root to carry a `testID`. Its member lists forward their own.
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
  "loader/Loader.tsx",
  "loader/ProgressBar.tsx",
  "loader/ProgressRing.tsx",
  "modal/WebModalFrame.tsx",
  "modal/WebModalFrame.web.tsx",
  "popover/Popover.tsx",
  "popover/PopoverSurface.tsx",
  "popover/PopoverSurface.web.tsx",
  "popover/ResponsiveMenu.tsx",
  "popover/ResponsivePopover.tsx",
  "popover/ResponsivePopover.web.tsx",
  "radio/RadioCard.tsx",
  "rich-text/RichTextEditor.tsx",
  "rich-text/RichTextEditor.web.tsx",
  "segmented/SegmentedControl.tsx",
  "sheet/BottomSheetShell.tsx",
  "sheet/Sheet.tsx",
  "sheet/Sheet.web.tsx",
  "skeleton/Skeleton.tsx",
  "sortable-list/SortableList.tsx",
  "spinner/Spinner.tsx",
  "status-dot/StatusDot.tsx",
  "switch/Switch.tsx",
  "table/Table.tsx",
  "timeline/Timeline.tsx",
  "timeline/TimelineClip.tsx",
  "timeline/TimelinePlayhead.tsx",
  "timeline/TimelineRuler.tsx",
  "timeline/TimelineTrackHeader.tsx",
  "toast/Toast.tsx",
  "toast/ToastLiveRegion.tsx",
  "toast/ToastViewport.tsx",
  "toast/ToastViewport.web.tsx",
  "typography/Typography.tsx",
  "video-editor/EffectsRack.tsx",
  "video-editor/ExportDialog.tsx",
  "video-editor/Inspector.tsx",
  "video-editor/InspectorRow.tsx",
  "video-editor/KeyframeEditor.tsx",
  "video-editor/LevelMeter.tsx",
  "video-editor/MediaBin.tsx",
  "video-editor/MediaBinItem.tsx",
  "video-editor/NumberScrubber.tsx",
  "video-editor/PreviewSurface.tsx",
  "video-editor/Scrubber.tsx",
  "video-editor/TransportBar.tsx",
  "video-editor/TransportButton.tsx",
  "workflow/WorkflowBuilder.tsx",
  "workflow/WorkflowEdge.tsx",
  "workflow/WorkflowNode.tsx",
] as const;

test("every public component file forwards a caller testID to a host", () => {
  for (const file of FORWARDING_FILES) {
    const source = readSource(`../../src/${file}`);
    // `testID={testID}` on a host element, or the AnimatedBorder default form
    // `testID={testID ?? "animated-border"}`.
    assert.match(
      source,
      /(?:testID|data-testid)=\{testID(\s*\?\?\s*"[^"]+")?\}/,
      `${file} should forward testID={testID} to a host element`,
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
    "rich-text/RichTextEditor.tsx": "rich-text/richTextTypes.ts",
    "rich-text/RichTextEditor.web.tsx": "rich-text/richTextTypes.ts",
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
