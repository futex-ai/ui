# Comboboxes

These sections extend the [Dropdown Selectors README](README.md).

## Combobox popover

Use `ComboboxPopover` plus `DropdownList` when the user keeps typing in an
existing input while results are open. This path uses a non-modal web portal so
focus stays in the input.

## Chip multi-select

Use `ComboboxMultiSelect` for removable-chip autocomplete controls. It is a full
labelled field: pass `label` / `hint` / `error` / `required` (and the shared
`labelInfo` ⓘ affordance) the same way as `DropdownSelector`, or omit `label` for
a bare control. The visible `label` names the combobox input via `aria-labelledby`,
`error` turns the control's border rose and is announced through an assertive live
region, and `required` wires `aria-required` plus the `*`:

```tsx
import { ComboboxMultiSelect } from "@firna/ui/dropdown";

<ComboboxMultiSelect
  error={bookIds.length === 0 ? "Select at least one book." : undefined}
  hint="Start typing to link the books this report should cover."
  label="Linked books"
  labelInfo="Linked books scope the report to specific ledgers. Leave it empty to include every active book."
  onChange={setBookIds}
  options={[{ label: "Greenhouse Studio", value: "book_123" }]}
  required
  values={bookIds}
/>;
```

Pass `size="sm" | "md" | "lg"` to align the control with the shared input size
scale. The chip field has no dense design, so `size="xs"` draws the `sm` chips
and box. Inside a `TouchSurface`, the search input is itself 44px high, each
chip has a 44 by 44px removal action, and the control grows to hold them. A
`singleLine` control stays on one line in a 46px frame. In a fixed-height table
or data-grid cell, combine `size="sm"` with `singleLine`: the first selected
chip stays visible, further selections collapse into a `+N` summary, and the
control keeps the same 32px height as a compact text input instead of growing
across adjacent rows. Selected option rows are enabled toggles, so pressing a
checked row removes that value even when its chip is summarized. Pass
`autoFocus` when the control mounts as an active embedded editor; its border and
shared focus glow then match the text-input family.

Set `autoFocus` when the multi-select mounts as an in-place editor. Focus opens
the option list immediately and gives the control the same primary active border
and shared focus glow as `InputFrame`; pressing anywhere inside the control also
returns focus to its search input. Use `focusIndicator="outline"` to keep the
active border while falling back to the browser's default focus outline, or
`focusIndicator="none"` to drop the glow, the outline, and the active border
when the surrounding surface shows focus itself.

Override the ⓘ glyph with `labelInfoIcon` and its accessible name with
`labelInfoLabel` (defaults to `More information about {label}`); `labelInfo` needs
a `label` to anchor the button (a dev-warned no-op otherwise). For the bare,
label-less variant pass `accessibilityLabel` to name the search input (it also
overrides the `label`-derived name where `aria-labelledby` is not honoured, e.g.
iOS) — mirroring `Input`.
