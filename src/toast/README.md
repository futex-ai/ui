# Toast

Transient notification toasts for React Native and React Native Web surfaces.
A `ToastProvider` owns a queue of toasts, the `useToast` hook publishes an
imperative `toast()` trigger, `toastController` exposes the same trigger outside
React components, and the toasts render in a viewport pinned to a corner of the
screen.

## Responsibilities

- Own a capped, ordered queue of live toasts and expose an imperative API
  (`toast`, `dismiss`, `dismissAll`) through React context and the module-level
  controller.
- Render the toast stack in a fixed/absolute viewport pinned to one of six
  placements, with the newest toast nearest the pinned edge.
- Auto-dismiss each toast after a per-toast duration, pause the countdown while
  the pointer or keyboard focus is over a toast, and support sticky toasts that
  stay until dismissed.
- Carry tone (`info` / `success` / `warning` / `error`) as colour, leading
  icon, and screen-reader semantics: errors announce assertively as an `alert`,
  everything else politely as a `status`.
- Offer a `solid` visual variant for compact filled feedback while keeping the
  default `card` variant unchanged.
- Let callers replace, add, or hide the leading icon so progress and branded
  feedback can reuse the same toast surface.
- Offer an optional action button (e.g. "Undo") and a close control.
- On web, float above every other overlay — modals, nested dropdowns, and the
  consent banner — so a confirmation or error stays visible. On native the
  overlay can still sit beneath a platform `Modal` (which renders in its own
  window); show critical confirmations before opening such a modal.

## What This Component Does

`ToastProvider` holds the queue, registers `toastController`, and renders
`ToastViewport`. On web the viewport is `ToastViewport.web.tsx`, which renders
through a `react-dom` `document.body` portal with `position: fixed` so it
escapes React Native Web stacking contexts. On native the sibling
`ToastViewport.tsx` renders an absolutely-positioned overlay in the provider's
tree — keep the provider near the app root so it covers the screen. Both render
the shared `Toast` surface, which owns its own auto-dismiss timer so trimming the
queue (which unmounts the toast) cancels the timer for free.

Use it for transient feedback: save confirmations, undoable actions, and
non-blocking errors. For blocking confirmation use a modal; for inline
validation use field-level messaging.

## Quick Start

```tsx
import { ToastProvider, toastController, useToast } from "@firna/ui/toast";

function App() {
  return (
    <ToastProvider placement="bottom-right">
      <Screen />
    </ToastProvider>
  );
}

function SaveButton() {
  const { toast } = useToast();
  return (
    <Button
      onPress={async () => {
        await save();
        toast({
          title: "Saved",
          description: "Your changes were saved.",
          tone: "success",
        });
      }}
    >
      Save
    </Button>
  );
}
```

- Pass `duration` (ms) to override the 5s default; pass `duration: null` for a
  sticky toast. The auto-dismiss countdown pauses while the pointer or keyboard
  focus is over the toast and resumes from where it stopped.
- Pass `variant: "solid"` for the compact filled presentation. To match the
  bottom-center transaction error toast, mount the provider with
  `placement="bottom-center"` and call:

```tsx
toastController.toast({
  dismissible: false,
  title: "Couldn't move this transaction. Try again.",
  tone: "error",
  variant: "solid",
});
```

- Pass `icon` to add a custom leading visual. The icon can be a React node or a
  render function that receives the resolved foreground colour, size, tone, and
  variant. To match the payslip-saving status toast, mount the provider with
  `placement="bottom-center"` and call:

```tsx
toastController.toast({
  dismissible: false,
  duration: null,
  foregroundColor: "#fff",
  icon: ({ color }) => <ActivityIndicator color={color} />,
  surfaceStyle: { backgroundColor: "#1c1f1d", gap: 16 },
  title: "Saving payslips to your device • 3 of 5",
  variant: "solid",
});
```

- Pass `titleStyle` and `descriptionStyle` to override the text styles for one
  toast. These style props layer after the built-in variant title and
  description styles.
- Pass `surfaceStyle` to override the toast surface and `foregroundColor` to
  override filled-toast text, icon, action, and close-control colour.
- Pass `action={{ label: "Undo", onPress }}` to add an action; pressing it runs
  `onPress` and dismisses the toast.
- `dismiss(id)` removes one toast (the id is returned from `toast()`),
  `dismissAll()` clears them, and `dismissible: false` hides the close button.
  A toast that is both sticky (`duration: null`) and `dismissible: false` has no
  in-UI affordance to close it — remove it with `dismiss(id)` or `dismissAll()`.
- `ToastProvider` accepts `placement`, `max` (queue cap, default 4), and
  `duration` (default delay). `toastController.toast()`, `.dismiss()`, and
  `.dismissAll()` delegate to the mounted provider and throw if called before a
  provider is mounted.

## Theming

Toasts read colours, fonts, and radii from `SharedUiThemeProvider`. Tone accents
map to theme tokens: `success` → `primary`, `warning` → `amber`, `error` →
`rose`, and `info` → `primaryDeep`. The `solid` variant uses the same tone map
as its filled background unless callers override the surface style.

## Development

Run focused checks after changing the toast system:

```bash
npm test
npm run typecheck
npm run storybook:build
npm run test:browser
```

### Key Code

- `ToastProvider.tsx` — owns the queue and renders the viewport.
- `ToastContext.ts` — context and the `useToast` hook.
- `toastController.ts` — method-call API backed by the mounted provider.
- `Toast.tsx` — toast surface, tone accent, and auto-dismiss/pause timer.
- `ToastViewport.web.tsx` — DOM-portalled, fixed web viewport.
- `ToastViewport.tsx` — native absolute-overlay viewport.
- `toastModel.ts` — pure types, queue, duration, a11y, and placement helpers.
- `toastStyles.ts` — theme-driven surface styles.
- `toastLayers.ts` — shared z-index contract.

### Related Docs

- Modal boundary: `src/modal/README.md`.
- Shared component protocol: `docs/protocol/shared-ui-components.md`.
