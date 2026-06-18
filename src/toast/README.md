# Toast

Transient notification toasts for React Native and React Native Web surfaces.
A `ToastProvider` owns a queue of toasts, the `useToast` hook publishes an
imperative `toast()` trigger, and the toasts render in a viewport pinned to a
corner of the screen.

## Responsibilities

- Own a capped, ordered queue of live toasts and expose an imperative API
  (`toast`, `dismiss`, `dismissAll`) through React context.
- Render the toast stack in a fixed/absolute viewport pinned to one of six
  placements, with the newest toast nearest the pinned edge.
- Auto-dismiss each toast after a per-toast duration, pause the countdown while
  the pointer or keyboard focus is over a toast, and support sticky toasts that
  stay until dismissed.
- Carry tone (`info` / `success` / `warning` / `error`) as colour, leading
  icon, and screen-reader semantics. The toast text is announced through a
  persistent, always-mounted live region (errors `aria-live="assertive"`,
  everything else `aria-live="polite"`, `aria-atomic` so title + description
  read as one unit) rather than from a region born with its content, which some
  screen readers skip (WCAG 2.1 — 4.1.3 Status Messages, AA). The visible toast
  keeps its `status` / `alert` role for identification but suppresses its own
  live announcement (`aria-live="off"`) so it is announced exactly once.
- Offer an optional action button (e.g. "Undo") and a close control.
- On web, float above every other overlay — modals, nested dropdowns, and the
  consent banner — so a confirmation or error stays visible. On native the
  overlay can still sit beneath a platform `Modal` (which renders in its own
  window); show critical confirmations before opening such a modal.

## What This Component Does

`ToastProvider` holds the queue and renders `ToastViewport`. On web the viewport
is `ToastViewport.web.tsx`, which renders through a `react-dom` `document.body`
portal with `position: fixed` so it escapes React Native Web stacking contexts.
On native the sibling `ToastViewport.tsx` renders an absolutely-positioned
overlay in the provider's tree — keep the provider near the app root so it
covers the screen. Both render the shared `Toast` surface, which owns its own
auto-dismiss timer so trimming the queue (which unmounts the toast) cancels the
timer for free.

Use it for transient feedback: save confirmations, undoable actions, and
non-blocking errors. For blocking confirmation use a modal; for inline
validation use field-level messaging.

## Quick Start

```tsx
import { ToastProvider, useToast } from "@firna/ui/toast";

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
- Pass `action={{ label: "Undo", onPress }}` to add an action; pressing it runs
  `onPress` and dismisses the toast.
- `dismiss(id)` removes one toast (the id is returned from `toast()`),
  `dismissAll()` clears them, and `dismissible: false` hides the close button.
  A toast that is both sticky (`duration: null`) and `dismissible: false` has no
  in-UI affordance to close it — remove it with `dismiss(id)` or `dismissAll()`.
- `ToastProvider` accepts `placement`, `max` (queue cap, default 4), and
  `duration` (default delay).

## Theming

Toasts read colours, fonts, and radii from `SharedUiThemeProvider`. Tone accents
map to theme tokens: `success` → `primary`, `warning` → `amber`, `error` →
`rose`, and `info` → `primaryDeep`.

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
- `Toast.tsx` — toast surface, tone accent, auto-dismiss/pause timer, close
  control with a keyboard focus ring, and focus hand-off on dismiss.
- `ToastLiveRegion.tsx` — persistent, always-mounted polite/assertive live
  region that announces toast text (4.1.3 AA).
- `ToastViewport.web.tsx` — DOM-portalled, fixed web viewport; mounts the live
  region and a labelled `region` landmark around the stack.
- `ToastViewport.tsx` — native absolute-overlay viewport.
- `toastModel.ts` — pure types, queue, duration, a11y, and placement helpers.
- `toastStyles.ts` — theme-driven surface styles.
- `toastLayers.ts` — shared z-index contract.

### Related Docs

- Modal boundary: `src/modal/README.md`.
- Shared component protocol: `docs/protocol/shared-ui-components.md`.
