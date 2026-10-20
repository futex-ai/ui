# Web Modal Frame

Reusable modal chrome for Firna apps, rendered as a centered dialog or a bottom
sheet. It is cross-platform via the file-resolution seam:

- **Web** — dialogs share one overlay root under `document.body` and one modal
  stack for focus, background content, and page scroll.
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

- Render web dialogs inside one shared overlay root so they escape page
  stacking contexts.
- Keep only the top dialog live. The page and lower dialogs stay inert and
  hidden from assistive technology while covered by an open dialog.
- Keep nested dialogs in tree order when they open together. A child dialog
  stays above its parent, and later siblings stay above earlier siblings.
- Move focus into the top dialog and keep Tab inside it. Restore focus to its
  opener on close, or to the dialog beneath when the opener is unavailable.
  Closing a lower dialog does not move focus.
- Lock page scroll until the last dialog closes without shifting the layout.
- Keep the toast region operable and its messages announced while dialogs are
  open.
- Provide consistent backdrop, title/subtitle, close control, scrollable body,
  footer actions, size variants, and busy/non-dismissible close policy.
- Honour `scroll={false}` on native bottom sheets with a static body, so nested
  controls such as date-wheel columns own their scrolling gestures.
- Support a centered dialog (`placement="center"`, the default) or a bottom
  sheet (`placement="bottom-sheet"`) pinned full-width to the viewport bottom.
- Expose named dialog semantics and a labelled close control. Keep the backdrop
  out of the tab order and the accessibility tree.
  On web, the close button shows a focus-visible ring according to the theme's
  `focusIndicator`, overridable with the frame's `focusIndicator` prop.
- Apply close policy to Escape, backdrop presses, the close button, and close
  requests. Route Escape to the topmost overlay only, including dropdowns and
  popovers opened inside the top dialog.
- Define modal layer tokens so nested dropdowns and comboboxes render above
  modal content while ordinary page content stays underneath the modal.

The [web overlays protocol](../../docs/protocol/web-overlays.md) defines the
focus, background-content, and layering rules.

## What This Component Does

`WebModalFrame` is the public frame. On web, it renders directly into the shared
overlay root and joins the internal modal stack. The public `WebModalPortal`
stays a separate `document.body` portal. Its content follows page-content rules
and does not join the dialog stack.

On native, the frame renders through a React Native `Modal`. Platform
resolution selects the implementation, and both platforms share the same props.
On iOS, a second native dialog must render inside the first dialog's content.
iOS presents one sibling modal at a time.

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

Pass `initialFocusRef` (web-only) to override where focus lands on open. Reach
for it when the first focusable caller control is the wrong landing spot, such
as a destructive confirmation where focus should start on the safe action.
Without a focusable caller control, focus falls back to the close button, then
the dialog surface.

```tsx
const cancelRef = useRef<View | null>(null);

<WebModalFrame
  footer={
    <>
      <Button onPress={onDelete} tone="danger">
        Delete
      </Button>
      <Button buttonRef={cancelRef} onPress={onClose}>
        Cancel
      </Button>
    </>
  }
  initialFocusRef={cancelRef}
  onClose={onClose}
  title="Delete book"
  visible={open}
>
  This cannot be undone.
</WebModalFrame>;
```

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

- `WebModalFrame.web.tsx` - web dialog presentation and stack integration.
- `WebModalFrame.tsx` - native RN `Modal` frame (sheet + dialog).
- `webModalStackModel.ts` - pure stack order, opener inheritance, focus-return,
  background-membership, and page-lock rules.
- `webModalStack.ts` - applies the stack to the DOM, including background
  state, focus return, and the shared Tab trap.
- `webModalScrollLock.ts` - locks page scroll while a dialog is open and pads
  the body so that the hidden scrollbar does not shift the layout.
- `webModalRoot.ts` - provides the shared overlay root under `document.body`.
- `webModalFocusTrap.ts` - selects initial focus and cycles Tab within the top
  dialog.
- `useWebModalLayer.ts` - connects frame visibility and parent-dialog context
  to the stack.
- `../liveOverlay.ts` - owns the live-overlay marker shared by the stack,
  toast viewport, and announcer.
- `webModalFrameStyles.ts` - theme-driven web style factory.
- `WebModalPortal.web.tsx` - public `document.body` portal for content outside
  the dialog stack.
- `WebModalPortal.tsx` - native-safe portal fallback (the native frame uses an RN `Modal`, not a portal).
- `modalLayers.ts` - shared z-index contract (web).
- `types.ts` - shared cross-platform prop contract.
- `webModalModel.ts` - pure close-policy and size helpers.

### Related Docs

- [Web overlays protocol](../../docs/protocol/web-overlays.md).
- [Web modal stack plan](../../plans/web-modal-stack.md).
- [Shared dropdown and modal library plan](../../plans/shared-dropdown-modal-library.md).
- [Dropdown boundary](../dropdown/README.md).
