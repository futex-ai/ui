# Sheet Protocol

## Status

Implemented on web, iOS, and Android. The native keyboard behaviour has not had
an on-device check.

## Purpose

`Sheet` in `@firna/ui/sheet` is a modal bottom sheet. On native it is a
gesture-driven sheet. On web it is the bottom-sheet placement of the modal
frame, `WebModalFrame` in `@firna/ui/modal`.

## Requirements

- `open` and `onClose` control the sheet.
- `label` names the sheet for assistive tech on both platforms, also when
  `title` sets a different visible title.
- The visible title is `title`, else `label`.
- On native, the header shows the `dismissLabel` text, "Cancel" by default.
- On web, a `dismissLabel` shows as a visible text button, and the text names
  the button.
- On web, without a `dismissLabel`, the close button is an ✕ icon named
  "Close {title}", where the title is `title`, else `label`.
- `hideHeader` hides the header row on native and the close button on web.
- `onClose` runs on a backdrop tap and on the dismiss control.
- On native, `onClose` also runs on a pan down and on the Android back button.
- On web, `onClose` also runs on Escape.
- The body is at most `maxHeight` tall and at most 70% of the viewport height.
  Taller content scrolls inside the sheet.
- On web, focus moves into the sheet when it opens: to `initialFocusRef` when
  set, else to the first control in the body.
- On web, focus returns to the element that had it when the sheet closes.
- On native, a tap on a control in the sheet reaches the control while the
  software keyboard is open.
- `SheetTextInput` is the text input for a sheet body.
- On native, the sheet stays above the software keyboard while a
  `SheetTextInput` in it has focus.
- Decision: text entry in a sheet uses `SheetTextInput`. Rejected: a plain text
  input. Reason: the native sheet moves above the keyboard only for its own
  input.

## Modal frame

The web sheet is the modal frame's bottom-sheet placement, so the modal frame
offers what the sheet needs. These hold for every modal frame placement.

- `accessibilityLabel` names the dialog. Without it, the visible title names
  the dialog.
- `closeText` shows visible text in place of the ✕ icon, and the text names the
  close button.
