# Web Modal Frame

Reusable modal chrome for Firna apps, rendered as a centered dialog or a bottom
sheet. It is cross-platform via the file-resolution seam:

- **React Native Web** — `WebModalFrame.web.tsx` renders through a `document.body`
  portal with a JS focus trap and the shared escape-layer stack.
- **Native iOS/Android** — `WebModalFrame.tsx` renders through a React Native
  `Modal` overlay. `placement="bottom-sheet"` uses `@gorhom/bottom-sheet` for a
  gesture-driven native sheet (drag/flick to dismiss, spring motion, a backdrop
  that dims with the drag, content-sized height); `placement="center"` is a plain
  centered dialog. `accessibilityViewIsModal` provides focus containment, and the
  Android hardware-back button is handled.

Both platforms share the prop contract in `types.ts` and the pure
close-policy/size helpers in `webModalModel.ts`, so the caller seam is identical
everywhere. The component keeps the `WebModalFrame` name for back-compat even
though it is now cross-platform.

> The native bottom sheet pulls in `@gorhom/bottom-sheet`, `react-native-reanimated`,
> and `react-native-gesture-handler` as **optional** peer deps (web-only consumers
> don't need them). The sheet is self-contained inside an RN `Modal` +
> `GestureHandlerRootView`, so consumers don't need a `BottomSheetModalProvider`.
> Remaining polish: a `react-native-safe-area-context` bottom inset (currently a
> fixed `paddingBottom`) and a sticky (non-scrolling) footer.

## Responsibilities

- Render web dialogs through a `document.body` portal so they escape React
  Native Web stacking contexts.
- Provide consistent backdrop, title/subtitle, close control, scrollable body,
  footer actions, size variants, and busy/non-dismissible close policy.
- Support a centered dialog (`placement="center"`, the default) or a bottom
  sheet (`placement="bottom-sheet"`) pinned full-width to the viewport bottom.
- Keep web focus behavior in one place: focus enters the close control while a
  modal is open, Tab stays inside the modal (the trap re-engages on every Tab,
  so focus that escapes to `<body>` is pulled back in), and focus returns to the
  previously focused element on close.
- Expose correct dialog semantics: the surface is a `role="dialog"` with
  `aria-modal` and is named by its title via `aria-labelledby` (the title is a
  `role="heading"`). Background page content is made `inert`/`aria-hidden` while
  the modal is open and restored on close, since RNW does not emit `inert` for
  `accessibilityViewIsModal`. The backdrop is a mouse-only dismiss target hidden
  from assistive tech and the tab order (Escape is the accessible close path).
  The close button shows a focus-visible ring on keyboard focus.
- Keep web close behavior explicit: Escape, backdrop press, close button, and
  request-close all use the same policy. Escape is routed through the shared
  escape-layer stack (`src/escapeLayer.ts`), so a dropdown, popover, or nested
  modal opened above this surface consumes Escape first and only the top-most
  overlay closes. While a modal is open the stack consumes Escape (the host
  app's own document/window Escape handlers will not fire); an open overlay owns
  Escape.
- Define modal layer tokens so nested dropdowns and comboboxes render above
  modal content while ordinary page content stays underneath the modal.

## What This Component Does

`WebModalFrame` is the public frame. The web build (`WebModalFrame.web.tsx`)
renders through `WebModalPortal.web.tsx` (`react-dom` `createPortal`); the native
build (`WebModalFrame.tsx`) renders through a React Native `Modal`. Metro/`tsc`
platform resolution picks the right file, and both honour the same props.

Use it for confirmation dialogs, form dialogs, and content-heavy dialogs, plus
bottom sheets on mobile (`placement="bottom-sheet"`). Do not use it for anchored
dropdown menus, input-backed combobox popovers, or OS-native pickers/action
sheets.

## Quick Start

```tsx
import { WebModalFrame } from "@firna/ui/modal";

<WebModalFrame
  footer={<Button onPress={onClose}>Done</Button>}
  onClose={onClose}
  title="Invite teammate"
  visible={open}
>
  <InviteForm />
</WebModalFrame>;
```

Use `dismissible={false}` when Escape/backdrop should not close the modal, and
`closeDisabled` while a submit is in flight. Pass `placement="bottom-sheet"` for
a bottom-pinned mobile-web sheet.

## Theming

Modal surfaces read colors, fonts, and radii from `SharedUiThemeProvider`. The
default theme matches the accounting source component, while consumers can
override primary and semantic tokens.

## Development

Run focused checks after changing the modal foundation:

```bash
npm test
npm run typecheck
npm run storybook:build
npm run test:browser
```

### Key Code

- `WebModalFrame.web.tsx` - web modal frame and focus/close behavior.
- `WebModalFrame.tsx` - native RN `Modal` frame (sheet + dialog).
- `webModalFrameStyles.ts` - theme-driven web style factory.
- `WebModalPortal.web.tsx` - DOM portal boundary.
- `WebModalPortal.tsx` - native-safe portal fallback (the native frame uses an RN `Modal`, not a portal).
- `modalLayers.ts` - shared z-index contract (web).
- `types.ts` - shared cross-platform prop contract.
- `webModalModel.ts` - pure close-policy and size helpers.

### Related Docs

- Plan: `plans/shared-dropdown-modal-library.md`.
- Dropdown boundary: `src/dropdown/README.md`.
