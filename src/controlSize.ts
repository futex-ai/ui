/**
 * The size scale shared by the library's interactive controls — the
 * {@link Button}, the {@link Input} / {@link Textarea} / {@link InputFrame}
 * text fields, the {@link DropdownSelector} field, the {@link DateField} /
 * {@link DateRangeField} triggers, the {@link SegmentedControl}, and the
 * {@link Switch} — so a form can size every control from a single vocabulary.
 * `md` is the default everywhere; `sm` is the compact density used in dense rows
 * and toolbars, and `lg` is the roomier density for primary calls to action and
 * touch-first layouts.
 */
export type ControlSize = "sm" | "md" | "lg";
