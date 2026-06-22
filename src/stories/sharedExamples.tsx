import {
  ChevronDown,
  MoreHorizontal,
  Plus,
  Settings,
  Trash2,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { useState } from "react";
import type { GestureResponderEvent } from "react-native";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import {
  ComboboxMultiSelect,
  DropdownIconBox,
  DropdownList,
  DropdownListEntry,
  DropdownMenu,
  DropdownPlacement,
  DropdownSelector,
  Popover,
  SharedUiTheme,
  SharedUiThemeOverrides,
  SharedUiThemeProvider,
  WebModalFrame,
  defaultSharedUiTheme,
  dropdownPlacement,
  dropdownSurfaceRect,
  useDropdownSurfaceStyles,
} from "../index";

const selectorOptions = [
  { label: "Standard", value: "standard" },
  { label: "Cash accounting", value: "cash" },
  { disabled: true, label: "Flat rate", value: "flat" },
];

const longSelectorOptions = Array.from({ length: 28 }, (_, index) => {
  const optionNumber = String(index + 1).padStart(2, "0");
  return {
    label: `Long option ${optionNumber}`,
    value: `long-${optionNumber}`,
  };
});

const books = [
  { color: "#4f7864", label: "Greenhouse Studio", mark: "G", value: "book_1" },
  { color: "#946727", label: "Payroll Reserve", mark: "P", value: "book_2" },
  { color: "#315f96", label: "VAT Archive", mark: "V", value: "book_3" },
];

const currencyOptions = [
  { label: "US Dollar", value: "usd" },
  { label: "Euro", value: "eur" },
  { label: "British Pound", value: "gbp" },
  { label: "Japanese Yen", value: "jpy" },
  { label: "Swiss Franc", value: "chf" },
  { label: "Canadian Dollar", value: "cad" },
  { label: "Australian Dollar", value: "aud" },
  { label: "Singapore Dollar", value: "sgd" },
  { label: "Hong Kong Dollar", value: "hkd" },
  { label: "Norwegian Krone", value: "nok" },
  { label: "Swedish Krona", value: "sek" },
  { label: "New Zealand Dollar", value: "nzd" },
];

export function SelectorExample() {
  const [value, setValue] = useState("standard");
  return (
    <DropdownSelector
      label="Scheme"
      onValueChange={setValue}
      options={selectorOptions}
      value={value}
    />
  );
}

const categorySections = [
  {
    options: [
      { label: "Sales", rightText: "4000", value: "4000" },
      { label: "Consultancy income", rightText: "4010", value: "4010" },
      { label: "Rental income", rightText: "4020", value: "4020" },
      { label: "Bank interest", rightText: "4030", value: "4030" },
      { label: "Other income", rightText: "4090", value: "4090" },
    ],
    title: "Income",
  },
  {
    options: [
      { label: "General expenses", rightText: "5000", value: "5000" },
      { label: "Software and tools", rightText: "5010", value: "5010" },
      { label: "Office costs", rightText: "5020", value: "5020" },
    ],
    title: "Expenses",
  },
];

export function CategorySelectExample() {
  // A category picker whose rows carry a trailing account code as `rightText`.
  // The selected row is preselected on open and takes the solid `primary` fill —
  // its code must invert to white rather than fade into the fill as muted grey.
  const [value, setValue] = useState("4020");
  return (
    <DropdownSelector
      label="Category"
      onValueChange={setValue}
      options={[]}
      sections={categorySections}
      value={value}
    />
  );
}

export function LongSelectorExample() {
  const [value, setValue] = useState("long-01");
  return (
    <DropdownSelector
      label="Long list"
      onValueChange={setValue}
      options={longSelectorOptions}
      value={value}
    />
  );
}

export function ScrollTrackingSelectorExample() {
  // A trigger near the top of a tall, scrollable page. The web menu renders in
  // a `position: fixed` portal, so this exercises that the surface re-measures
  // and follows the trigger as the page scrolls instead of floating away.
  const [value, setValue] = useState("standard");
  return (
    <View style={styles.scrollTrackingPage}>
      <Text style={styles.placementHintText}>
        Open the selector, then scroll the page — the menu stays anchored to its
        trigger instead of detaching.
      </Text>
      <DropdownSelector
        label="Scroll field"
        onValueChange={setValue}
        options={selectorOptions}
        value={value}
      />
      <View style={styles.scrollTrackingFiller} />
    </View>
  );
}

export function SelectorWithHeaderFooterExample() {
  const [value, setValue] = useState("long-01");
  return (
    <DropdownSelector
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={() => undefined}
          style={styles.menuFooterAction}
        >
          <Plus color="#2f5945" size={15} />
          <Text style={styles.menuFooterText}>Add scheme</Text>
        </Pressable>
      }
      header={<Text style={styles.menuHeaderText}>Choose a scheme</Text>}
      label="Scheme"
      onValueChange={setValue}
      options={longSelectorOptions}
      value={value}
    />
  );
}

export function SearchableSelectorExample() {
  const [value, setValue] = useState("usd");
  return (
    <DropdownSelector
      label="Currency"
      onValueChange={setValue}
      options={currencyOptions}
      searchable
      value={value}
    />
  );
}

export function ActionMenuExample() {
  const [lastAction, setLastAction] = useState("None");
  const entries: DropdownListEntry[] = [
    {
      id: "settings",
      label: "Settings",
      leading: <DropdownIconBox Icon={Settings} />,
      onPress: () => setLastAction("Settings"),
      type: "item",
    },
    { id: "divider", label: "divider", type: "divider" },
    {
      id: "delete",
      label: "Remove",
      leading: <DropdownIconBox Icon={Trash2} tone="danger" />,
      onPress: () => setLastAction("Remove"),
      tone: "danger",
      type: "item",
    },
  ];

  return (
    <View style={styles.actionMenuExample}>
      <DropdownMenu entries={entries} minWidth={180}>
        <Pressable
          accessibilityLabel="Open action menu"
          accessibilityRole="button"
          style={styles.iconButton}
        >
          <MoreHorizontal color="#3e4540" size={18} />
        </Pressable>
      </DropdownMenu>
      <Text style={styles.actionMenuStatus}>Last action: {lastAction}</Text>
    </View>
  );
}

export function ActionMenuSubtextExample() {
  const [lastAction, setLastAction] = useState("None");
  const entries: DropdownListEntry[] = [
    {
      id: "settings",
      label: "Settings",
      leading: <DropdownIconBox Icon={Settings} />,
      onPress: () => setLastAction("Settings"),
      secondary: "Members, roles & billing",
      type: "item",
    },
    {
      id: "delete",
      label: "Remove business",
      leading: <DropdownIconBox Icon={Trash2} tone="danger" />,
      onPress: () => setLastAction("Remove"),
      secondary: "Permanently delete this workspace",
      tone: "danger",
      type: "item",
    },
  ];

  return (
    <View style={styles.actionMenuExample}>
      <DropdownMenu entries={entries} minWidth={240}>
        <Pressable
          accessibilityLabel="Open settings menu"
          accessibilityRole="button"
          style={styles.iconButton}
        >
          <MoreHorizontal color="#3e4540" size={18} />
        </Pressable>
      </DropdownMenu>
      <Text style={styles.actionMenuStatus}>Last action: {lastAction}</Text>
    </View>
  );
}

export function HoverMenuExample() {
  const entries: DropdownListEntry[] = [
    { id: "profile", label: "Profile", onPress: () => undefined, type: "item" },
    { id: "billing", label: "Billing", onPress: () => undefined, type: "item" },
  ];

  return (
    <DropdownMenu entries={entries} minWidth={180} trigger="hover">
      <Pressable
        accessibilityLabel="Open hover menu"
        accessibilityRole="button"
        style={styles.button}
      >
        <Text style={styles.buttonText}>Hover me</Text>
      </Pressable>
    </DropdownMenu>
  );
}

export function LongPressMenuExample() {
  const entries: DropdownListEntry[] = [
    { id: "rename", label: "Rename", onPress: () => undefined, type: "item" },
    {
      id: "duplicate",
      label: "Duplicate",
      onPress: () => undefined,
      type: "item",
    },
  ];

  return (
    <DropdownMenu entries={entries} minWidth={180} trigger="longPress">
      <Pressable
        accessibilityLabel="Open long-press menu"
        accessibilityRole="button"
        style={styles.button}
      >
        <Text style={styles.buttonText}>Hold me</Text>
      </Pressable>
    </DropdownMenu>
  );
}

export function ContextMenuExample() {
  const entries: DropdownListEntry[] = [
    { id: "copy", label: "Copy", onPress: () => undefined, type: "item" },
    { id: "paste", label: "Paste", onPress: () => undefined, type: "item" },
  ];

  return (
    <DropdownMenu entries={entries} minWidth={180} trigger="contextMenu">
      <Pressable
        accessibilityLabel="Open context menu"
        accessibilityRole="button"
        style={styles.button}
      >
        <Text style={styles.buttonText}>Right-click me</Text>
      </Pressable>
    </DropdownMenu>
  );
}

export function PopoverExample() {
  return (
    <Popover
      minWidth={240}
      trigger={({ open, triggerProps }) => (
        <Pressable
          {...triggerProps}
          accessibilityLabel="Details"
          accessibilityRole="button"
          style={[styles.button, open ? styles.buttonOpen : null]}
        >
          <Text style={styles.buttonText}>Details</Text>
        </Pressable>
      )}
    >
      {({ close }) => (
        <View style={styles.popoverCard}>
          <Text style={styles.popoverTitle}>Greenhouse Studio</Text>
          <Text style={styles.popoverBody}>
            Standard VAT scheme · GBP · Reconciled to 31 May.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={close}
            style={styles.popoverClose}
          >
            <Text style={styles.popoverCloseText}>Close</Text>
          </Pressable>
        </View>
      )}
    </Popover>
  );
}

export function ControlledPopoverExample() {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.controlledPopover}>
      <Text style={styles.popoverStatus}>
        {open ? "Popover is open" : "Popover is closed"}
      </Text>
      <Popover
        minWidth={240}
        onOpenChange={setOpen}
        open={open}
        trigger={({ open: isOpen, triggerProps }) => (
          <Pressable
            {...triggerProps}
            accessibilityLabel="Account"
            accessibilityRole="button"
            style={[styles.button, isOpen ? styles.buttonOpen : null]}
          >
            <Text style={styles.buttonText}>Account</Text>
          </Pressable>
        )}
      >
        {({ close }) => (
          <View style={styles.popoverCard}>
            <Text style={styles.popoverTitle}>Greenhouse Studio</Text>
            <Text style={styles.popoverBody}>
              Owner · billing@greenhouse.example
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={close}
              style={styles.popoverClose}
            >
              <Text style={styles.popoverCloseText}>Close</Text>
            </Pressable>
          </View>
        )}
      </Popover>
    </View>
  );
}

export function InputBackedComboboxExample() {
  return (
    <ComboboxMultiSelect
      footer="Only active books can be selected."
      onChange={() => undefined}
      options={books}
      values={["book_1"]}
    />
  );
}

export function ChipMultiSelectExample() {
  const [values, setValues] = useState(["book_1"]);
  return (
    <ComboboxMultiSelect
      footer="Only active books can be selected."
      onChange={setValues}
      options={books}
      values={values}
    />
  );
}

export function ModalExample({
  placement,
  title,
}: {
  placement: "bottom-sheet" | "center";
  title: string;
}) {
  const [visible, setVisible] = useState(true);
  const [text, setText] = useState("");
  return (
    <View>
      <Pressable
        accessibilityLabel={`Open ${title}`}
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Open modal</Text>
      </Pressable>
      <WebModalFrame
        footer={
          <Pressable
            accessibilityRole="button"
            onPress={() => setVisible(false)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Done</Text>
          </Pressable>
        }
        onClose={() => setVisible(false)}
        placement={placement}
        subtitle="Shared modal chrome with focus and close handling."
        title={title}
        visible={visible}
      >
        <View style={styles.modalBody}>
          <TextInput
            accessibilityLabel="Modal text field"
            onChangeText={setText}
            placeholder="Type here"
            style={styles.input}
            value={text}
          />
          <DropdownSelector
            label="Nested selector"
            onValueChange={() => undefined}
            options={selectorOptions}
            value="standard"
          />
        </View>
      </WebModalFrame>
    </View>
  );
}

export function ThemeSwatch({ label }: { label: string }) {
  return (
    <View style={styles.themeDemo}>
      <Text style={styles.heading}>{label}</Text>
      <SelectorExample />
    </View>
  );
}

export function StorySurface({
  children,
  theme = defaultSharedUiTheme,
}: {
  children: ReactNode;
  theme?: SharedUiTheme | SharedUiThemeOverrides;
}) {
  return (
    <SharedUiThemeProvider theme={theme}>
      <View style={styles.surface}>{children}</View>
    </SharedUiThemeProvider>
  );
}

// --- Placement / edge-collision examples ----------------------------------
//
// These stories pin triggers to the real viewport edges so you can watch the
// menu reposition itself: it flips above the trigger when there is no room
// below, and slides inward so it never spills past the left or right edge. The
// web portal renders through a `position: fixed` layer over the document body,
// so within Storybook the surface reacts to the canvas (iframe) edges. Pair
// each one with `parameters: { layout: "fullscreen" }`.

const placementOptions = Array.from({ length: 10 }, (_, index) => {
  const optionNumber = String(index + 1).padStart(2, "0");
  return { label: `Region ${optionNumber}`, value: `region-${optionNumber}` };
});

/**
 * Theme-wrapped surface that fills the Storybook canvas so triggers inside it
 * can be anchored to the true viewport edges.
 */
export function ViewportStage({ children }: { children: ReactNode }) {
  const { height, width } = useWindowDimensions();
  return (
    <SharedUiThemeProvider theme={defaultSharedUiTheme}>
      <View style={[styles.stage, { height, width }]}>{children}</View>
    </SharedUiThemeProvider>
  );
}

function PlacementHint({ lines, title }: { lines: string[]; title: string }) {
  return (
    <View style={styles.placementHint}>
      <Text style={styles.placementHintTitle}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.placementHintText}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function EdgeSelector({ label }: { label: string }) {
  const [value, setValue] = useState(placementOptions[0].value);
  return (
    <View style={styles.edgeSelector}>
      <DropdownSelector
        label={label}
        onValueChange={setValue}
        options={placementOptions}
        value={value}
      />
    </View>
  );
}

export function EdgePlacementGridExample() {
  return (
    <ViewportStage>
      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <EdgeSelector label="Top left" />
          <EdgeSelector label="Top center" />
          <EdgeSelector label="Top right" />
        </View>
        <View style={[styles.gridRow, styles.gridRowCenter]}>
          <EdgeSelector label="Mid left" />
          <PlacementHint
            lines={[
              "Open any selector.",
              "Menus near the bottom flip upward, and menus near an",
              "edge slide inward so they always stay on screen.",
            ]}
            title="Edge-aware placement"
          />
          <EdgeSelector label="Mid right" />
        </View>
        <View style={[styles.gridRow, styles.gridRowBottom]}>
          <EdgeSelector label="Bottom left" />
          <EdgeSelector label="Bottom center" />
          <EdgeSelector label="Bottom right" />
        </View>
      </View>
    </ViewportStage>
  );
}

export function BottomEdgeFlipExample() {
  const [near, setNear] = useState(longSelectorOptions[0].value);
  const [far, setFar] = useState(longSelectorOptions[0].value);
  return (
    <ViewportStage>
      <View style={styles.flipColumn}>
        <View style={styles.flipCell}>
          <Text style={styles.placementHintText}>
            Anchored near the top edge — the long menu opens downward.
          </Text>
          <DropdownSelector
            label="Opens below"
            onValueChange={setNear}
            options={longSelectorOptions}
            value={near}
          />
        </View>
        <View style={styles.flipCell}>
          <Text style={styles.placementHintText}>
            Anchored near the bottom edge — the same menu flips to open upward.
          </Text>
          <DropdownSelector
            label="Flips above"
            onValueChange={setFar}
            options={longSelectorOptions}
            value={far}
          />
        </View>
      </View>
    </ViewportStage>
  );
}

function EdgeMenuButton({
  accessibilityLabel,
  align,
  label,
  minWidth = 320,
}: {
  accessibilityLabel: string;
  align?: "end" | "start";
  label: string;
  minWidth?: number;
}) {
  const entries: DropdownListEntry[] = currencyOptions.map((option) => ({
    id: option.value,
    label: option.label,
    onPress: () => undefined,
    type: "item",
  }));
  return (
    <DropdownMenu
      align={align}
      entries={entries}
      minWidth={minWidth}
      style={styles.edgeMenuAnchor}
    >
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={styles.edgeButton}
      >
        <Text style={styles.edgeButtonText}>{label}</Text>
        <ChevronDown color="#3e4540" size={16} />
      </Pressable>
    </DropdownMenu>
  );
}

export function HorizontalEdgeClampExample() {
  return (
    <ViewportStage>
      <View style={styles.clampColumn}>
        <PlacementHint
          lines={[
            "Both menus are wider than the triggers that open them.",
            "Each one slides inward so it never spills past the left",
            "or right edge of the screen.",
          ]}
          title="Horizontal edge clamping"
        />
        <View style={styles.clampRow}>
          <EdgeMenuButton
            accessibilityLabel="Open left edge menu"
            label="Left edge"
          />
          <EdgeMenuButton
            accessibilityLabel="Open right edge menu"
            label="Right edge"
          />
        </View>
      </View>
    </ViewportStage>
  );
}

export function EndAlignedMenuExample() {
  return (
    <ViewportStage>
      <View style={styles.endAlignColumn}>
        <PlacementHint
          lines={[
            'With align="end" the menu’s right edge lines up with the',
            "trigger, so a wide menu extends leftward from a right-aligned",
            "control instead of overflowing.",
          ]}
          title="End-aligned menu"
        />
        <View style={styles.endAlignRow}>
          <EdgeMenuButton
            accessibilityLabel="Open end aligned menu"
            align="end"
            label="Account actions"
            minWidth={300}
          />
        </View>
      </View>
    </ViewportStage>
  );
}

const PLAYGROUND_FRAME = { height: 360, width: 660 };
const PLAYGROUND_ANCHOR = { height: 34, width: 152 };

function playgroundEntries(): DropdownListEntry[] {
  return [
    { id: "rename", label: "Rename", onPress: () => undefined, type: "item" },
    {
      id: "duplicate",
      label: "Duplicate",
      onPress: () => undefined,
      type: "item",
    },
    { id: "move", label: "Move to…", onPress: () => undefined, type: "item" },
    { id: "divider", label: "divider", type: "divider" },
    { id: "archive", label: "Archive", onPress: () => undefined, type: "item" },
  ];
}

function placementReadout(placement: DropdownPlacement) {
  const vertical =
    placement.side === "top"
      ? `bottom ${Math.round(placement.bottom ?? 0)}`
      : `top ${Math.round(placement.top ?? 0)}`;
  return `left ${Math.round(placement.left)} · ${vertical} · width ${Math.round(
    placement.width,
  )} · max-height ${Math.round(placement.maxHeight)}`;
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function PlacementPlaygroundBody() {
  const frame = PLAYGROUND_FRAME;
  const anchorSize = PLAYGROUND_ANCHOR;
  const surfaceStyles = useDropdownSurfaceStyles();
  const [point, setPoint] = useState({
    x: (frame.width - anchorSize.width) / 2,
    y: frame.height * 0.42,
  });

  const moveToCenter = (centerX: number, centerY: number) => {
    setPoint({
      x: clampValue(
        centerX - anchorSize.width / 2,
        0,
        frame.width - anchorSize.width,
      ),
      y: clampValue(
        centerY - anchorSize.height / 2,
        0,
        frame.height - anchorSize.height,
      ),
    });
  };
  const onResponderMove = (event: GestureResponderEvent) =>
    moveToCenter(event.nativeEvent.locationX, event.nativeEvent.locationY);

  const placement = dropdownPlacement(
    {
      height: anchorSize.height,
      width: anchorSize.width,
      x: point.x,
      y: point.y,
    },
    frame,
    { maxHeight: 200, minHeight: 110, minWidth: 220 },
  );

  const presets = [
    { key: "top-left", label: "Top-left", x: anchorSize.width * 0.7, y: 30 },
    {
      key: "top-right",
      label: "Top-right",
      x: frame.width - anchorSize.width * 0.7,
      y: 30,
    },
    { key: "center", label: "Center", x: frame.width / 2, y: frame.height / 2 },
    {
      key: "bottom-left",
      label: "Bottom-left",
      x: anchorSize.width * 0.7,
      y: frame.height - 30,
    },
    {
      key: "bottom-right",
      label: "Bottom-right",
      x: frame.width - anchorSize.width * 0.7,
      y: frame.height - 30,
    },
  ];

  return (
    <View style={styles.playground}>
      <PlacementHint
        lines={[
          "Drag inside the frame (or use the presets) to move the trigger.",
          "The menu re-resolves against the content-area edges in real time.",
        ]}
        title="Placement playground"
      />
      <View
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onResponderMove}
        onResponderMove={onResponderMove}
        onStartShouldSetResponder={() => true}
        style={[styles.playFrame, { height: frame.height, width: frame.width }]}
      >
        <Text style={[styles.playEdgeLabel, styles.playEdgeTop]}>top edge</Text>
        <Text style={[styles.playEdgeLabel, styles.playEdgeBottom]}>
          bottom edge
        </Text>
        <View
          pointerEvents="none"
          style={[
            styles.playAnchor,
            {
              height: anchorSize.height,
              left: point.x,
              top: point.y,
              width: anchorSize.width,
            },
          ]}
        >
          <Text style={styles.playAnchorText}>Trigger</Text>
        </View>
        <View
          pointerEvents="none"
          style={[surfaceStyles.surface, dropdownSurfaceRect(placement)]}
        >
          <DropdownList
            entries={playgroundEntries()}
            label="Placement preview"
            maxHeight={placement.maxHeight}
            onClose={() => undefined}
          />
        </View>
      </View>
      <View style={styles.presetRow}>
        {presets.map((preset) => (
          <Pressable
            accessibilityLabel={`Move trigger to ${preset.label.toLowerCase()}`}
            accessibilityRole="button"
            key={preset.key}
            onPress={() => moveToCenter(preset.x, preset.y)}
            style={styles.presetButton}
          >
            <Text style={styles.presetButtonText}>{preset.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.readout}>
        <Text style={styles.readoutPrimary}>
          {placement.side === "top" ? "Opens upward ↑" : "Opens downward ↓"}
        </Text>
        <Text style={styles.readoutText}>{placementReadout(placement)}</Text>
      </View>
    </View>
  );
}

export function PlacementPlaygroundExample() {
  return (
    <ViewportStage>
      <PlacementPlaygroundBody />
    </ViewportStage>
  );
}

const styles = StyleSheet.create({
  actionMenuExample: {
    alignItems: "flex-start",
    gap: 8,
  },
  actionMenuStatus: {
    color: "#3e4540",
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#2f5945",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  buttonOpen: {
    backgroundColor: "#24432f",
  },
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  clampColumn: {
    flex: 1,
    gap: 16,
    padding: 16,
  },
  clampRow: {
    alignItems: "flex-start",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  controlledPopover: {
    alignItems: "flex-start",
    gap: 8,
  },
  edgeButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#d3d8cd",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    height: 38,
    paddingHorizontal: 14,
  },
  edgeButtonText: {
    color: "#1c1f1d",
    fontSize: 13,
    fontWeight: "700",
  },
  edgeMenuAnchor: {
    alignSelf: "flex-start",
  },
  edgeSelector: {
    minWidth: 150,
  },
  endAlignColumn: {
    flex: 1,
    gap: 16,
    padding: 16,
  },
  endAlignRow: {
    alignItems: "flex-start",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  flipCell: {
    gap: 8,
  },
  flipColumn: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
    width: 360,
  },
  grid: {
    flex: 1,
    justifyContent: "space-between",
    padding: 16,
  },
  gridRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridRowBottom: {
    alignItems: "flex-end",
  },
  gridRowCenter: {
    alignItems: "center",
  },
  heading: {
    color: "#1c1f1d",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#d3d8cd",
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  input: {
    borderColor: "#d3d8cd",
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minWidth: 240,
    padding: 10,
  },
  menuFooterAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 4,
  },
  menuFooterText: {
    color: "#2f5945",
    fontSize: 13,
    fontWeight: "700",
  },
  menuHeaderText: {
    color: "#1c1f1d",
    fontSize: 13,
    fontWeight: "800",
  },
  modalBody: {
    gap: 12,
  },
  placementHint: {
    backgroundColor: "#fff",
    borderColor: "#d8dccf",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    maxWidth: 340,
    padding: 14,
  },
  placementHintText: {
    color: "#3e4540",
    fontSize: 13,
    lineHeight: 18,
  },
  placementHintTitle: {
    color: "#1c1f1d",
    fontSize: 14,
    fontWeight: "800",
  },
  playAnchor: {
    alignItems: "center",
    backgroundColor: "#2f5945",
    borderRadius: 8,
    justifyContent: "center",
    position: "absolute",
  },
  playAnchorText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  playEdgeBottom: {
    bottom: 6,
  },
  playEdgeLabel: {
    color: "#69706a",
    fontSize: 11,
    fontWeight: "700",
    left: 0,
    position: "absolute",
    right: 0,
    textAlign: "center",
  },
  playEdgeTop: {
    top: 6,
  },
  playFrame: {
    backgroundColor: "#fbfbf8",
    borderColor: "#c7cdbd",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  playground: {
    gap: 16,
    padding: 24,
  },
  popoverBody: {
    color: "#3e4540",
    fontSize: 13,
    lineHeight: 18,
  },
  popoverCard: {
    gap: 6,
    padding: 12,
  },
  popoverClose: {
    alignSelf: "flex-start",
    paddingTop: 4,
  },
  popoverCloseText: {
    color: "#2f5945",
    fontSize: 13,
    fontWeight: "700",
  },
  popoverStatus: {
    color: "#3e4540",
    fontSize: 13,
    fontWeight: "600",
  },
  popoverTitle: {
    color: "#1c1f1d",
    fontSize: 14,
    fontWeight: "800",
  },
  presetButton: {
    backgroundColor: "#e7ebe1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetButtonText: {
    color: "#2f5945",
    fontSize: 13,
    fontWeight: "700",
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  readout: {
    backgroundColor: "#1c2620",
    borderRadius: 10,
    gap: 4,
    padding: 14,
  },
  readoutPrimary: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  readoutText: {
    color: "#b9c6bd",
    fontSize: 13,
  },
  scrollTrackingFiller: { flex: 1 },
  scrollTrackingPage: { gap: 16, minHeight: 1600, padding: 24 },
  stage: {
    backgroundColor: "#eef1ea",
    overflow: "hidden",
    position: "relative",
  },
  surface: {
    minWidth: 320,
    padding: 24,
  },
  themeDemo: {
    minWidth: 320,
  },
});
