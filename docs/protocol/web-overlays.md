# Web Overlays Protocol

## Status

Implemented contract for shared dialogs, web overlay stacking, live
notifications, and the page scroll lock.

## Purpose

Define how dialogs, page content, and notifications behave when overlays are
open. This page extends the
[shared UI component protocol](shared-ui-components.md).

## Modal Contract

The modal family provides centered dialogs and bottom sheets on web and native
platforms.

- Dialogs provide a backdrop, surface, title, optional subtitle, and close
  control.
- Dialogs support a scrollable body, footer content, and size variants.
- Dialogs support centered placement and bottom-sheet placement.
- Close policy applies to Escape, backdrop presses, the close control, and
  close requests.
- A non-dismissible dialog rejects Escape, backdrop presses, and close
  requests.
- The close control can close a non-dismissible dialog unless closing is
  disabled.
- A dialog with closing disabled rejects every close action.
- Dialogs expose accessible names from their titles.
- Close controls expose accessible labels.
- Web dialogs expose modal dialog semantics to assistive technology.

### Web Stack Order

- All shared web dialogs render inside one shared overlay root under
  `document.body`.
- DOM order inside that root matches the dialog stack order.

Decision: Use one shared root instead of a separate body portal per dialog.
This keeps the page boundary and dialog order consistent.

- Opening a dialog puts it above the dialogs already open.
- Dialogs that open in the same render update follow component tree order.
- A dialog rendered inside another dialog's content appears above its parent.
- Among sibling dialogs opened together, a later sibling appears above an
  earlier sibling.

Decision: Support nested dialogs opened together instead of requiring separate
render updates.
Confirmation dialogs commonly belong inside another dialog's content.

- The existing dialog API provides stacking without consumer registration.
- The library does not expose a public stack-registration API.

Decision: Keep the stack internal instead of exposing registration for
consumer-owned frames, because application overlays already use the shared
dialog.

### Background Content

Inert content cannot receive focus or pointer input.

- While a dialog is open, every dialog beneath the top dialog is inert.
- Those lower dialogs are hidden from assistive technology.
- Among dialogs, only the top dialog receives focus, Tab, Escape, and pointer
  input.
- Page content present when a dialog opens stays inert while that dialog
  remains open, except for [live overlays](#live-overlays).
- That page content stays hidden from assistive technology for the same
  period.
- Page content returns to its prior interaction and accessibility state when
  all dialogs that opened over it have closed.
- An overlay open on the page or inside a dialog becomes background when a
  later dialog opens.
- It becomes live again when that later dialog closes, unless another open
  dialog still keeps it in the background.

Decision: Support stacked dialogs directly instead of requiring callers to hide
the lower dialog.
Users need working keyboard input in the upper dialog.

Decision: Restore each overlay when the last dialog opened over it closes,
instead of waiting for all dialogs to close.
This lets a dropdown in the revealed dialog work again.

### Focus And Escape

- Opening the top dialog moves focus into it.
- A caller-specified initial focus target takes precedence over the default
  target.
- Default initial focus goes to the first focusable caller control in the
  dialog.
- When no caller control is focusable, initial focus goes to the close
  control.
- When no control is focusable, initial focus goes to the dialog surface.
- Tab cycles within the top dialog.
- When focus leaves the top dialog, the next Tab returns it to that dialog.
- Closing the top dialog returns focus to the element that opened it.
- This also applies when the opener is inside the dialog beneath.
- If the opener is gone or inert, focus moves to the initial focus target of
  the dialog beneath.
- If no dialog remains and the opener is gone or inert, focus stays where the
  browser puts it.
- Closing a dialog below the top dialog does not move focus.
- A higher dialog opened from inside that closed dialog returns focus to the
  closed dialog's opener when it later closes.
- The same focus fallback rules apply to this inherited opener.
- Escape closes only the topmost overlay, subject to its close policy.
- This Escape rule also applies when dialogs open in the same render update.
- A dropdown or popover opened above a dialog receives Escape before that
  dialog.
- An open overlay consumes Escape so the host application's Escape handlers
  do not also dismiss content.

Decision: Escape follows visible dialog order instead of a separate dismissal
order.
This makes the top dialog the dismissal target.

### Public Modal Portal

- The public modal portal renders its web content directly under
  `document.body`.
- That content follows the page-content modality rules.
- That content does not join the dialog stack.

Decision: Keep public portal content on the page instead of inside the dialog
root.
This lets open dialogs disable that content.

### Page Scroll

- The page does not scroll while a dialog is open.
- Removing the page scrollbar does not shift the layout.
- Closing the last dialog restores the page's prior scroll behavior.

Decision: Lock page scroll instead of leaving the page scrollable under the
backdrop.
The first dialog opening and the last dialog closing define the lock duration.

### Native Dialogs

Native dialogs keep platform modal presentation.
On iOS, a second native dialog must render inside the first dialog's content.
iOS presents one sibling modal at a time.
The public web portal renders no content on native.

Decision: Keep the platform modal path instead of building a native stack,
because the operating system already provides modality.

## Live Overlays

- The toast region remains operable while a web dialog is open.
- Toast live-region messages remain announced while a web dialog is open.
- Announcer messages remain announced while a web dialog is open.
- These guarantees apply to toasts shown before or after a dialog opens.
- Dropdowns and popovers follow the [background-content rules](#background-content).

Decision: Keep notifications live instead of disabling all overlays outside the
top dialog, so users can receive feedback and act on it.
Dropdowns and popovers receive no exemption because a later dialog makes them
background content.

## Layering Contract

- Ordinary content sits below dropdowns and modal layers on web.
- Each dialog's backdrop sits below its surface.
- Each dialog keeps its own backdrop while another dialog is open.
- Stacked dialog backdrops darken the page cumulatively.

Decision: Keep every backdrop instead of hiding lower backdrops, because
cumulative dimming matches common dialog behavior.

- Dropdowns and comboboxes opened inside the top dialog sit above its surface.
- The web toast viewport sits above dialog surfaces, nested dropdown and
  combobox overlays, and the cookie-consent banner.
- Date calendar popovers, dropdown portals, and generic popovers use a high
  default overlay floor on web.
- Those overlays expose z-index overrides for consumer-owned stacking
  contexts above the shared defaults.
- Public layer tokens let consumers align adjacent overlays without
  hard-coded numeric z-index values.
