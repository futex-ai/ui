# Popover menus

These sections extend the [Popover README](README.md).

## ResponsiveMenu

`ResponsiveMenu` is a menu over the `ResponsivePopover` surface — an anchored
dialog on web, a bottom sheet on native — that gives the responsive surface the
same keyboard behaviour as [`DropdownMenu`](../dropdown/menus.md#action-menus): opening moves
focus into the dialog surface, yet ↑/↓ still move the active row and Enter
selects. Reach for it instead of dropping a bare `DropdownList` into a
`ResponsivePopover`: that list's key handler is bound to its inner `ScrollView`,
so it only fires while focus sits inside the scroll node — but the surface takes
focus on open, so the keydowns bubble past it and nothing navigates.
`ResponsiveMenu` fixes this by owning the same `useDropdownSelectorNavigation`
document-level listener `DropdownMenu` uses and driving the list through a
controlled active row, so navigation is independent of where focus lands. On
native there is no keyboard — the rows are tapped directly.

You supply `entries` (the same [`DropdownListEntry`](../dropdown/menus.md) rows)
plus the `ResponsivePopover` surface props; the caller still owns the trigger and
`open` state. Rows close the surface after selection unless `closeOnSelect` is
`false`.

```tsx
import { ResponsiveMenu } from "@firna/ui/popover";

const anchorRef = useRef<View>(null);
const [open, setOpen] = useState(false);

<Pressable ref={anchorRef} aria-expanded={open} onPress={() => setOpen((o) => !o)}>
  <Text>Row actions</Text>
</Pressable>
<ResponsiveMenu
  anchorRef={anchorRef}
  label="Row actions"
  maxHeight={320}
  minWidth={220}
  onClose={() => setOpen(false)}
  open={open}
  entries={[
    { id: "rename", label: "Rename", onPress: rename, type: "item" },
    { id: "delete", label: "Delete", onPress: remove, tone: "danger", type: "item" },
  ]}
/>;
```

On a touch surface `ResponsiveMenu` opens the phone menu sheet instead, on web
and native (see below). Pass `size` to set its rows, for example `"xs"` for
26px rows in the anchored web dialog; the sheet's touch rows keep the title
weight of that size. Outside a `TouchSurface`, the anchored web dialog and the
native sheet keep their behaviour: the document key listener and the first row
active on web, and the standard rows on native.

## InlineMenu

`InlineMenu` draws a menu open in place beside its trigger: no portal and no
measurement, so static and server-rendered HTML shows it open. It wraps the
trigger, its `children`, in a self-hugging view that positions the menu and
lifts itself above the content that follows while the menu is open. The caller
owns `open` and `onClose`, and places the menu with `side` (`below` or
`above`) and `align` (`start` or `end`), because static HTML cannot measure.

```tsx
import { InlineMenu } from "@firna/ui/popover";

<InlineMenu
  align="end"
  entries={[
    {
      icon: Pencil,
      id: "rename",
      label: "Rename",
      onPress: rename,
      type: "item",
    },
    { id: "divider", label: "", type: "divider" },
    {
      icon: Archive,
      id: "archive",
      label: "Archive project",
      onPress: archive,
      tone: "danger",
      type: "item",
    },
  ]}
  label="Project actions"
  onClose={() => setOpen(false)}
  open={open}
  size="xs"
>
  <Button
    accessibilityLabel="Project actions"
    expanded={open}
    hasPopup="menu"
    icon={MoreHorizontal}
    onPress={() => setOpen((current) => !current)}
    shape="square"
    size="xs"
    tone="ghost"
  />
</InlineMenu>;
```

- Opening moves focus to the menu, a `DropdownList` in `list` focus mode, with
  its first enabled row active (`activeId` controls it). ↑/↓ skip disabled
  rows, labels, dividers, and notes; Enter or Space runs the active row once;
  Escape and an outside press close the menu, and focus returns to the
  trigger. The keys stay on the focused list, so nothing listens on the
  document for them.
- The menu is content-sized between `minWidth` (180) and `maxWidth` (360), or
  `width` wide. Rows scroll after `maxHeight` (320).
- The menu cannot leave a clipping ancestor (`overflow: hidden`) or a stacking
  context that the wrapper does not lift. Give such an ancestor room, or use
  `DropdownMenu`, which portals.
- On a touch surface, and always on native, `InlineMenu` opens the phone menu
  sheet instead. The web-only placement props are then ignored.

## Phone menu sheet

On a touch surface, `InlineMenu` and `ResponsiveMenu` open the same sheet
through `Sheet`: a modal dialog named by the menu `label`, with a visible
`title` (default `label`), a 44px close control (`dismissLabel`), and touch
rows of at least 44px. It opens without an active row, and the arrow keys
still move one. The keys stay on the focused list, so Tab reaches the close
control and Enter there closes the sheet. The sheet keeps the modal behaviour:
the focus trap, Escape, a backdrop press, Android back, and focus return to the
trigger.

`InlineMenuSheet` draws the same sheet open in place, for static and
server-rendered HTML such as a phone mockup: a backdrop, the grip, the title,
the close control, and the rows, with no active row. It fills its nearest
positioned ancestor. It is a named dialog but not a modal one, because nothing
keeps focus inside a drawing.

```tsx
import { InlineMenuSheet } from "@firna/ui/popover";

<View style={styles.phoneScreen}>
  <ProjectPage />
  <InlineMenuSheet
    entries={projectActions}
    label="Project actions"
    onClose={closeMenu}
    size="xs"
    title="Billing portal"
  />
</View>;
```

## ContextMenu

`ContextMenu` is the menu a secondary gesture opens — right-click on web,
long-press on native. It differs from every other surface here in one way that
drives its whole design: **it has no trigger element.** It is positioned at the
_point_ of the gesture through the portal's virtual `anchorRect`, not measured
against a box. On native there is no cursor to anchor to, so it renders as a
bottom sheet via `ResponsiveMenu`.

The gesture itself comes from `contextMenuTriggerProps`, which returns
`onContextMenu` on web (suppressing the browser's own menu) and `onLongPress` on
native. Neither branch wires `onPress`, so a plain tap or click is always left to
the host — the same contract `DropdownMenu`'s `contextMenu` trigger mode keeps.
`contextMenuPoint` reads the viewport coordinates back out of the event.

```tsx
import { ContextMenu, contextMenuTriggerProps } from "@firna/ui/popover";
import { Platform } from "react-native";

const [point, setPoint] = useState<DropdownPoint | null>(null);

<View
  {...contextMenuTriggerProps({
    isWeb: Platform.OS === "web",
    onOpen: setPoint,
  })}
>
  <Text>Right-click me</Text>
</View>
<ContextMenu
  accessibilityLabel="Row actions"
  entries={[
    { id: "rename", label: "Rename", onPress: rename, type: "item" },
    { id: "sep", label: "", type: "divider" },
    { id: "delete", label: "Delete", onPress: remove, tone: "danger", type: "item" },
  ]}
  onClose={() => setPoint(null)}
  open={point !== null}
  point={point}
  title="Row 4"
/>;
```

`point` doubles as the open guard: the menu stays closed while it is `null`, so
a gesture that yields no coordinates (a handler invoked with no event) is a
no-op rather than a menu in the corner. Set `title` for native — a sheet slides
up detached from whatever was pressed, so without it there is nothing to say
which row or column the actions apply to.

Two defaults are deliberately not left to callers. `minWidth` (220) is required
arithmetic, not taste: a point anchor is zero-width, `dropdownPlacement`'s
preferred width falls back to the anchor's width, and `dropdownWidthBounds`
treats that width as a minimum — so without it the surface resolves to 0px wide
and disappears. And `highlightVariant` is pinned to `"ring"` because the solid
active fill inverts row text to white, which a caller's `leading` icons cannot
opt out of.

Keyboard navigation runs on the same `useDropdownSelectorNavigation`
document-level listener as `ResponsiveMenu`, for the same reason: with nothing
focusing the surface, `DropdownList`'s own key handler — bound to its inner
`ScrollView` — never fires. Dismissal adds one rule the anchored surfaces do not
need: **the menu closes on scroll.** `useDropdownDismiss` closes on an outside
`pointerdown`, which a wheel is not, so a scroll would otherwise leave the menu
pinned to a point whose content had moved out from under it. Scrolls originating
inside the menu's own list are ignored, so a long menu still scrolls.

[`DataGrid`](../data-grid/README.md) is the reference consumer: it drives one
`ContextMenu` for header, row-gutter, and cell regions.
