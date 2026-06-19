# Web Modal Frame

Reusable modal chrome for React Native Web product surfaces. Native iOS and
Android should keep using platform-native modal, sheet, action-sheet, or OS
picker views instead of this component.

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

`WebModalFrame` is the public frame. It is implemented in
`WebModalFrame.web.tsx` and renders through `WebModalPortal.web.tsx`, which
uses `react-dom` `createPortal`. The sibling non-web files are native-safe
fallbacks for TypeScript and Metro platform resolution; product code should
still treat the component as web-only.

Use it for web confirmation dialogs, form dialogs, and content-heavy web
dialogs. Do not use it for anchored dropdown menus, input-backed combobox
popovers, native date pickers, native bottom sheets, or native action sheets.

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
- `webModalFrameStyles.ts` - theme-driven modal style factory.
- `WebModalFrame.tsx` - native-safe fallback.
- `WebModalPortal.web.tsx` - DOM portal boundary.
- `WebModalPortal.tsx` - native-safe portal fallback.
- `modalLayers.ts` - shared z-index contract.
- `webModalModel.ts` - pure close-policy and size helpers.

### Related Docs

- Plan: `plans/shared-dropdown-modal-library.md`.
- Dropdown boundary: `src/dropdown/README.md`.
