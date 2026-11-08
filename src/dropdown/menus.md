# Menus and lists

These sections extend the [Dropdown Selectors README](README.md).

## Action menus

Use `DropdownMenu` for the common action-menu case. It owns the anchor ref,
open state, portal/list composition, and closes after selectable row presses by
default. When the menu opens, the first selectable row is active immediately;
ArrowUp / ArrowDown move that active row, mouse hover keeps the active row in
sync with the pointer, and Enter / Space activates the active row:

```tsx
import { DropdownMenu } from "@firna/ui/dropdown";

<DropdownMenu align="end" entries={entries} minWidth={220}>
  <Pressable
    accessibilityLabel={`Actions for ${name}`}
    accessibilityRole="button"
    style={styles.memberMenuButton}
  >
    <MoreHorizontal color={colors.ink2} size={17} />
  </Pressable>
</DropdownMenu>;
```

Each `item` / `footer` entry accepts an optional `testID`, forwarded to that
row's pressable (`data-testid` on web) so an end-to-end test can target a
specific row; `DropdownSelectorOption` exposes the same `testID` for the
select-only picker.

## Row slots and the active-row color

The default `solid` highlight fills the active row with `primary` and inverts
everything the library renders itself — `label`, `secondary`, `rightText`, and
the selection check — to white. It cannot recolor a node it was merely handed,
so a `leading`/`right` node with a hard-coded color (`<Icon color={ink} />`)
stays near-black on that fill while the label beside it turns white.

Both slots therefore accept either a plain node or a render function receiving
the row's resolved content color, so a caller can tint its own glyph from any
icon set:

```tsx
const entries: DropdownListEntry[] = [
  {
    id: "settings",
    label: "Settings",
    leading: ({ color }) => (
      <Ionicons color={color} name="settings-outline" size={18} />
    ),
    onPress: openSettings,
    type: "item",
  },
];
```

The color tracks the label for the same row state: `surface` (white) on the
solid active fill, `primaryDeep` on the other active/selected variants, `ink` at
rest, and the tone accent (`rose` / `amber`) on a `danger` / `amber` row off the
inverted fill. A plain node still passes through untouched, which is the right
choice for content that owns its color regardless of row state (an avatar, a
category swatch). For trailing _text_, prefer the library-styled `rightText`
string over a hand-colored `right` node.

## Controlled menus

Pass `open` and `onOpenChange` for controlled state, `defaultOpen` for
uncontrolled initial state, and `closeOnSelect={false}` when a row should keep
the menu open. `entries` may also be a function that receives
`{ close, open, toggle }` for uncommon rows that need direct control. When the
trigger needs open-state styling, pass a function child that receives
`{ open, triggerProps }` and spread `triggerProps` onto the pressable so the
standard press and keyboard handlers stay attached.

## Trigger modes

By default the menu opens on press. Pass `trigger` to change how the child opens
it:

- `"press"` (default) — tap or click opens the menu, on every platform.
- `"hover"` — pointer hover opens it on web. The menu auto-wires
  `useDropdownHover` and bridges the trigger-to-surface gap, so no manual hook is
  needed. Press stays wired as the touch/keyboard fallback. On native, where
  hover does not exist, only press opens it.
- `"longPress"` — a press-and-hold opens it on web and native. A plain tap is
  left to the trigger's own `onPress`, so a tappable row stays tappable.
- `"contextMenu"` — right-click opens it on web (the browser's native menu is
  suppressed) and a long-press opens it on native. A plain tap is again left to
  the trigger.

```tsx
<DropdownMenu entries={entries} trigger="hover">
  <Pressable accessibilityLabel="Account" accessibilityRole="button">
    <Text>Account</Text>
  </Pressable>
</DropdownMenu>
```

In every mode the trigger advertises its menu to assistive tech with
`aria-haspopup="menu"` and reflects the open state with `aria-expanded`.
`longPress` and `contextMenu` are secondary-gesture triggers, so they never
hijack a tap; Enter/Space and ArrowDown open the menu from the keyboard in every
mode, so keyboard-only users can always reach it (right-click is also
keyboard-reachable on web via the context-menu key). For per-platform behavior,
drive the prop yourself, for example
`trigger={Platform.OS === "web" ? "hover" : "longPress"}`.

## Row sizes, choices, and notes

`DropdownList` draws its rows at the size that the caller gives, and every
addition below is opt-in, so a list without them renders as before:

- `size="xs"` draws 26px dense rows: 13/18px labels at weight 400, 12px
  details, 14px icons, and a 4 by 8px row inset. Every other size, and no size,
  draws the standard rows (about 34px, with 13/18px labels at weight 700).
- Inside a `TouchSurface`, every list takes the touch rows, whatever its size:
  at least 44px for one line, with 15/20px labels, 13/18px details, and 18px
  icons. The label keeps the weight of the size. This covers the popups of the
  selector, the chip multi-select, the menus, and the slash menu.
- `icon` on an item draws a decorative glyph at the size of the row: muted at
  rest, and in the label color on a highlighted or toned row. A `leading` slot
  replaces it.
- `checked` on an item of a menu (`listRole="menu"`) makes it a choice: a menu
  radio item with `aria-checked` on web and the radio role with its checked
  state on native. The checked row shows a check mark after any `rightText`. A
  listbox ignores `checked` and keeps `selected`.
- `{ id, label, type: "note" }` is muted text that explains the rows near it.
  It is never active, and on web it describes the list through
  `aria-describedby`.
- `focusMode="list"` makes the list one tab stop: it points
  `aria-activedescendant` at the active row, the rows leave the tab order, and
  the list handles the arrow keys, Enter, Space, and Escape itself, without a
  document listener. Without an active row, as in a sheet that has just opened,
  the list shows the shared focus glow. Pass `listRef` to focus the list. A list
  without a `listId` makes its own in this mode, so the active row always has an
  id. `InlineMenu` and the phone menu sheet use this mode.

```tsx
<DropdownList
  entries={[
    { id: "sort-by", label: "Sort by", type: "section" },
    {
      checked: true,
      id: "recent",
      label: "Recent activity",
      onPress: sortByActivity,
      type: "item",
    },
    {
      checked: false,
      id: "name",
      label: "Name",
      onPress: sortByName,
      type: "item",
    },
    { id: "divider", label: "", type: "divider" },
    { id: "note", label: "Pinned projects stay at the top.", type: "note" },
  ]}
  focusMode="list"
  label="Sort projects"
  listRole="menu"
  maxHeight={320}
  onClose={close}
  size="xs"
/>
```

## Custom pickers

Use `DropdownPortal` plus `DropdownList` directly for custom pickers that need
to own the anchor ref, surface body, or list wiring. The portal treats the
anchor width as its minimum by default, matching menus and selectors. A compact
fixed-width surface that may be narrower than a wide anchor can pass
`anchorWidthAsMinimum={false}` with explicit `minWidth` / `maxWidth` bounds; the
web date calendar uses this policy to remain `280px` wide below a full-width
field. `DropdownMenu`, `Popover`, and `ComboboxPopover` forward the option with
their other shared placement props.

## Placement

Vertically, the web portal places a surface by its own size: it lays the
surface out once at its natural height (up to `maxHeight`), measures it, and
places it before the browser paints — below the anchor when the whole surface
fits there, otherwise on whichever side is roomier, clamped to that side's
room. Nothing needs to declare its height, so a fixed-layout surface such as
the date calendar flips instead of being clipped, and a short menu stays below
a trigger near the viewport edge. The height is measured once per open, so a
list that filters or grows while open keeps its side and scrolls within the
clamp. `minHeight` raises the room a surface needs below on top of its measured
height, for content expected to grow after opening. The combobox and rich-text
slash-menu portals share this through `useDropdownSurfacePlacement`. Native
does not measure: the Modal-backed portal opens below while `minHeight`
(default `140px`) fits there.

## Hover timing

`trigger="hover"` covers the common hover menu. For custom hover timing, keep
`trigger="press"` and wire `useDropdownHover` on the trigger yourself, passing
`surfaceHoverProps` into `DropdownMenu` or `DropdownPortal`. The hook keeps the
menu open across the small pointer gap between the trigger and the portal
surface, and a consumer-supplied `surfaceHoverProps` still composes with the
built-in bridge when `trigger="hover"`.
