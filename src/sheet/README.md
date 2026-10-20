# Sheet

A modal **bottom sheet** for React Native and React Native Web: a surface pinned
to the bottom edge that slides up to host arbitrary content — a form, a menu
list, a picker — behind one controlled API.

- **Native (iOS/Android)** — `Sheet.tsx` renders a `@gorhom/bottom-sheet` sheet
  (drag/flick to dismiss, spring motion, a dimming backdrop, content-sized
  height) inside an RN `Modal` + `GestureHandlerRootView`, with a grip handle,
  an optional header (title + `Cancel`), and a scrollable body capped at ~70% of
  the viewport. The gesture/backdrop plumbing lives in the internal
  `BottomSheetShell`, which the modal module's `bottom-sheet` placement reuses so
  the wiring exists in exactly one place.
- **Web** — `Sheet.web.tsx` reuses the modal frame's `bottom-sheet` placement
  (`WebModalFrame`): a `document.body` portal, height animation, focus trap, and
  escape-layer dismissal.

`Sheet` is the primitive that [`ResponsivePopover`](../popover/README.md)
composes on native. Reach for `ResponsivePopover` when you want one anchored
surface that adapts (popover on web, sheet on native); reach for `Sheet`
directly when you always want a bottom sheet.

> The native sheet pulls in `@gorhom/bottom-sheet`, `react-native-reanimated`,
> and `react-native-gesture-handler` as **optional** peer deps (web-only
> consumers don't need them). It is self-contained inside an RN `Modal` +
> `GestureHandlerRootView`, so consumers don't need a `BottomSheetModalProvider`.
> Remaining polish: a `react-native-safe-area-context` bottom inset (currently a
> fixed `paddingBottom`).

## Usage

```tsx
import { Sheet } from "@firna/ui/sheet";

const [open, setOpen] = useState(false);

<Sheet
  label="Line settings"
  maxHeight={360}
  onClose={() => setOpen(false)}
  open={open}
>
  {({ close, maxHeight }) => (
    <View style={{ gap: 12 }}>
      <DropdownSelector
        label="VAT scheme"
        value={scheme}
        onValueChange={setScheme}
        options={schemes}
      />
      <Button onPress={close}>Done</Button>
    </View>
  )}
</Sheet>;
```

The sheet is **controlled**: pass `open` and handle `onClose`. A backdrop tap or
the dismiss control calls it on both platforms. Native adds a pan down and the
Android back button; web adds Escape. The `children` body may be a plain node or
a `({ close, maxHeight }) => node` render function, where `maxHeight` is the
body height available before the content scrolls. `close` closes the sheet: on
native it animates the sheet down, and on web it calls `onClose` at once.

### Text input

Use `SheetTextInput` for text entry in a sheet body. It takes the platform text
input props. On native it keeps the sheet above the software keyboard while it
has focus; a plain text input does not lift the gorhom sheet. Outside a sheet it
renders a plain input. On web it is the plain input.

```tsx
import { Sheet, SheetTextInput } from "@firna/ui/sheet";

<Sheet
  dismissLabel="Done"
  label="Rename tag"
  onClose={close}
  open={open}
  title="Tag name"
>
  <SheetTextInput
    accessibilityLabel="Tag name"
    onChangeText={setName}
    value={name}
  />
</Sheet>;
```

On native, a tap on a row or a button in the sheet reaches it while the
keyboard is open; the keyboard does not take the first tap.

## Props

| Prop              | Platform | Notes                                                                                                                                  |
| ----------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `open`            | both     | Controlled visibility.                                                                                                                 |
| `onClose`         | both     | Backdrop and dismiss control. Native: also pan-down and Android back. Web: also Escape.                                                |
| `label`           | both     | Accessible name (required), also when `title` differs; default visible title.                                                          |
| `title`           | both     | Visible title when it should differ from `label`.                                                                                      |
| `children`        | both     | Node or `({ close, maxHeight }) => node`.                                                                                              |
| `maxHeight`       | both     | Body cap; also clamped to ~70% of the viewport.                                                                                        |
| `dismissLabel`    | both     | Native: dismiss text, default `"Cancel"`. Web: when set, visible text on the close button; else an ✕ named `"Close {title ?? label}"`. |
| `hideHeader`      | both     | Native: hide the header row (the grip stays). Web: hide the close button. Default `false`.                                             |
| `initialFocusRef` | web      | Element focused on open instead of the first control.                                                                                  |

## Accessibility

The surface is a modal dialog named by `label` (WCAG 4.1.2). Native uses
`accessibilityViewIsModal` for focus containment and closes on the Android back
button; web inherits the modal frame's focus trap, focus restore, and
escape-layer dismissal, so a dropdown or combobox opened inside the sheet
consumes Escape first and only the top-most overlay closes.

## Development

The web build is covered by the Storybook interaction and axe sweeps
(`npm run test:browser`). The native gorhom sheet renders only on device, so
exercise it in the `storybook-native/` Expo host after changing `Sheet.tsx` or
`BottomSheetShell.tsx`:

```bash
npm test
npm run typecheck
npm run storybook:build
npm run test:browser
```

Run the sheet checklist in `storybook-native/README.md` on a device after a
change to the native sheet.

### Key Code

- `Sheet.tsx` / `Sheet.web.tsx` — the native gorhom sheet and the web modal
  frame placement.
- `SheetTextInput.tsx` / `SheetTextInput.web.tsx` — the sheet's text input.
- `BottomSheetShell.tsx` — the internal gorhom wiring shared with the modal's
  native bottom sheet.
- `sheetModel.ts` and `types.ts` — the height cap and the shared props.

### Related Docs

- Requirements: [docs/protocol/sheet.md](../../docs/protocol/sheet.md)
