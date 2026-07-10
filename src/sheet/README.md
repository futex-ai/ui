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

The sheet is **controlled**: pass `open` and handle `onClose` (backdrop tap,
pan-down, Android back, or the header dismiss control). The `children` body may
be a plain node or a `({ close, maxHeight }) => node` render function, where
`close` animates the sheet down and `maxHeight` is the body height available
before the content scrolls.

## Props

| Prop           | Platform | Notes                                                  |
| -------------- | -------- | ------------------------------------------------------ |
| `open`         | both     | Controlled visibility.                                 |
| `onClose`      | both     | Backdrop / pan-down / Android-back / dismiss control.  |
| `label`        | both     | Accessible name (required); default visible title.     |
| `title`        | both     | Visible title when it should differ from `label`.      |
| `children`     | both     | Node or `({ close, maxHeight }) => node`.              |
| `maxHeight`    | both     | Body cap; also clamped to ~70% of the viewport.        |
| `dismissLabel` | native   | Header dismiss control text. Default `"Cancel"`.       |
| `hideHeader`   | native   | Hide the header row (the grip stays). Default `false`. |

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
