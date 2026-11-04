# Form model

Status: Active. On branch `calummoore/ui-forms-model`, no pull request yet. The
pull request that completes the work deletes this plan, as the `plans` skill
says.

`@firna/ui` has field components but no form model. Each app wires
validation, errors, focus, submit, failed writes, and leaving by hand.
Bookfolio (`futex-ai/accounting`) has the most form work: the App forms
contract in its `docs/protocol/app-forms.md`, about 1,200 lines of form hooks
in `ts/app/src/forms/`, and command palette forms with steps and server
drafts. About a dozen of its 40-plus form surfaces use those hooks. One cause
is the setup that each form repeats: one ref per field, change tracking, the
write guard, and the handle for its host.

This plan adds a form model to the library with no new dependency. A form
declares its values, labels, rules, and request once. One hook connects the
fields and the write. Shared hosts give every form the same footer, discard
guard, shortcuts, and focus rules. The plan does not change Bookfolio or
Firna. Each app adopts the model in its own plan. The command palette search,
commands, form URLs, and book subject stay in each app.

Contract owners:

- [Forms](../docs/protocol/forms.md), added by Milestone 1.
- [Web overlays](../docs/protocol/web-overlays.md), for the native sheet
  close request and footer.
- The [form README](../src/form/README.md), added by Milestone 3.
- The root [README](../README.md).

Replaced ways: none in this repository. Bookfolio's `ts/app/src/forms/`, its
`FormDialog`, `FormActions`, `FieldFocusTarget`, and its palette form level
are consumers outside this repository. Bookfolio's adoption plan moves them.

## Decisions

The brainstorm notes and sources are in `.context/forms-model/brainstorm.md`.
The options check of 2026-11-04 is in
`.context/form-model/options-check-2026-11-04.md`. It confirmed B for both
decisions and added options 1E, 1F, and 2D.

Terms:

- **Bookfolio:** the accounting app in `futex-ai/accounting`, with its form
  code in `ts/app/src/forms/` and `ts/app/src/components/commandPalette/`.
- **App forms contract:** Bookfolio's agreed form rules in
  `docs/protocol/app-forms.md`, for example that an error shows only after a
  submit or an edit.
- **Host:** the surface that shows a form and owns its chrome, such as a
  palette form level, a dialog, or a page.
- **Form handle:** what a form gives its host, such as dirty state, the
  primary label, submit, busy state, steps, and a held draft.
- **Palette form level:** the form sub-page of Bookfolio's command palette,
  with a title row, a step marker, the fields, and a footer.

### 1. How a form is declared once

- **Severity:** High. **Effort:** Large.
- **Source:** Design.
- **Category:** Code structure.
- **Location:** None. New code goes in `src/form/` and exports as
  `@firna/ui/form`.
- **Terms:**
  - **Field binding:** the props that one field gets from the form: its
    value, change handler, visible error, and focus ref.
  - **Write guard:** Bookfolio's lock that holds a write from the press until
    it settles, so no second write starts.
- **Background:** Bookfolio's model is a set of hooks and pure helpers in
  `ts/app/src/forms/`. Each form makes one ref per field and calls
  `markChanged` in each change handler. Each form also runs the write guard
  and gives its handle to the host itself.
- **Problem:** The library has no form model, so each form repeats this
  setup. A form that skips one step drifts from the contract. One example is a
  field with no focus target.
- **Impact if no action:** Bookfolio and Firna keep separate form code, and
  new forms keep drifting from the contract.
- **Root question:** How should an app declare a form once, so that
  validation, errors, focus, submit, failed writes, and leaving work the same
  on every host?
- **Options:**
  - **A.** Port Bookfolio's hooks and helpers into `@firna/ui/form` as they
    are. Each form keeps its own setup code, so drift stays possible. Effort:
    Medium.
  - **B.** Add `defineForm` for the pure model and `useForm` for the state.
    The hook owns dirty state, error timing, server errors, focus refs, the
    write guard, and the handle. It adds no dependency, but it is a new public
    API to keep stable. Effort: Large.
  - **C.** Build the bindings and hosts of B on `react-hook-form` as a new peer
    dependency. Bookfolio's sign-in forms would then use the same engine as the
    rest. The contract rules still need custom code on top, and web-only apps
    install one more package. Effort: Large.
  - **D.** Add B and a renderer. A form lists typed field descriptors, and
    `<FormFields>` renders them in order. Simple forms need the least code.
    Dependent fields need escape hatches, and layout moves into a second
    system. Effort: Large.
  - **E.** Let each field family bind itself on B's store. `Input`,
    `DateField`, `SegmentedControl`, and the other fields read the nearest
    form and bind through a `name` prop. Each field needs the least code. A
    `name` loses the value-type check, and every field family then depends on
    the form model. Effort: Large.
  - **F.** Ship B with list fields and grouped fields. `form.list(f)` gives
    each repeating row its own bindings, errors, focus targets, and server
    error paths, and one field can own several value keys. Bookfolio's
    invoice lines, Add transaction, and Issue shares then fit without new
    value shapes. The store and the API grow, with new rules for row identity
    and focus order. Effort: Large.
- **Left out:** Keeping forms in each app fails the goal. A web `<form>` with
  browser validation has no native equivalent. Server-only rules from an
  app's Rust backend fail the contract, which shows errors after an edit and
  blocks an invalid submit before any write. Rules that an app generates from
  its backend types still plug into B as plain functions. Per-form error
  timing breaks the consistency that the task asks for. Option C keeps its
  letter as a record, but it now breaks Cal's requirement of 2026-11-04 that
  the library adds no dependency.
- **Wider fix:** B. The bindings supply each focus target and the error
  timing, so a form cannot skip them.
- **Previous examples:** Bookfolio `ts/app/src/forms/`, which its PR #708
  added for the App forms contract. Bookfolio
  `ts/app/src/components/commandPalette/forms/AddAccountForm.tsx`, which
  connects each field by hand. Bookfolio `ts/app/src/forms/validation.ts`,
  which uses `react-hook-form` with Zod. Bookfolio's
  `plans/app-forms-contract.md` has eight open review findings. Option B
  removes its findings 1, 4, and 6 by design in each form that adopts it.
- **Related:** Decision 2 waits for this answer, because its hosts read the
  handle that this choice defines.
- **Recommendation:** B. It removes the setup code that slows adoption, and it
  adds no dependency. F can follow on top of B when the first list editor
  adopts the model.
- **Action:** apply B. Cal chose B on 2026-11-04 and said that the library
  must not add a dependency.

### 2. How much form hosting the library owns

- **Severity:** Medium. **Effort:** Large.
- **Source:** Design.
- **Category:** Code structure.
- **Location:** None.
- **Terms:**
  - **Form panel:** a host frame with the title row, step marker, fields,
    discard guard, and a footer with the actions and key hints.
- **Background:** Bookfolio's palette form level owns the leave rules, step
  Back, held drafts, the discard guard, the footer, and Cmd/Ctrl-Enter. Its
  dialog and page hosts repeat part of these rules in `useFormHost`,
  `FormDialog`, and `FormActions`. The palette search, commands, form URLs, and
  book subject are specific to Bookfolio. Firna's palette has no forms, and its
  feedback form opens in its own modal. Each effort below adds to the effort of
  decision 1.
- **Problem:** A form model alone leaves each app to build its own form chrome
  and leave rules.
- **Impact if no action:** Each app keeps its own copy of the leave, guard,
  and footer rules, and the copies drift.
- **Root question:** How much of form hosting, including the palette, should
  the library own?
- **Options:**
  - **A.** Ship the handle, the pure leave and step rules, the write notice,
    the discard guard, and a host hook. Each app builds its own palette,
    dialog, and page chrome on them. Effort: Medium.
  - **B.** Ship A, a `FormDialog` on the library's modal frame, and a form
    panel that an app's palette or page embeds. Search, commands, URLs, and
    the book subject stay in each app. Effort: Large.
  - **C.** Ship B and a shared command palette: the overlay, search levels,
    keyboard rules, level stack, direct launch, and a typed form registry.
    Apps supply the commands, results, subject, and URL sync. Effort: Large,
    about two to three times B.
  - **D.** Ship B, and make `WebModalFrame` run the leave decision for a form
    that registers inside it. Escape, the backdrop, the close control, and
    Android back then wait during a write and ask on a dirty form, also in an
    app's own dialog wrapper. The modal family then reads the form host
    context, and the modal contract changes. A Cancel button in an app-owned
    footer still bypasses it. Effort: Large.
- **Left out:** Shipping no host pieces fails the goal, because each app would
  still code the discard guard and the submit shortcut.
- **Wider fix:** B. One shared frame holds the leave, guard, and footer rules.
  C also shares the palette shell.
- **Previous examples:** Bookfolio `PaletteFormLevel.tsx`, `useFormHost.ts`,
  `FormDialog.tsx`, and `FormActions.tsx`. Firna
  `ts/app/src/command-palette/`.
- **Related:** Decision 1. These hosts read the handle that decision 1
  defines.
- **Recommendation:** B. It moves the palette's form rules into the library
  and leaves out the app-specific search and URL rules. C can follow as its
  own plan when both apps use B. D can follow if Bookfolio keeps dialog forms
  on its own `ResponsiveDialog`.
- **Action:** apply B. Cal chose B on 2026-11-04.

## Design

### The API, by example

A pure model module. It imports no React and has its own unit test:

```ts
import { defineForm, required } from "@firna/ui/form";

type AddAccountContext = { selfAssessment: boolean };

export const addAccountForm = defineForm({
  initialValues: {
    type: "expense" as AccountType,
    code: "",
    name: "",
    category: null as TaxCategory | null,
  },
  fields: ["type", "code", "name", "category"], // reading order
  labels: {
    type: "Type",
    code: "Code",
    name: "Name",
    category: "Income Tax category",
  },
  // The category shows only in Self Assessment books, for income and expense.
  show: {
    category: (values, context: AddAccountContext) =>
      context.selfAssessment && isProfitAndLoss(values.type),
  },
  rules: {
    code: required("Enter an account code."),
    name: required("Enter an account name."),
    category: required("Choose an Income Tax category."), // only while it shows
  },
  // A new type clears a category that no longer fits. The cleared field counts as changed.
  derive: (values) =>
    categoryFits(values) ? values : { ...values, category: null },
  request: (values, context: AddAccountContext) =>
    accountCreateRequest(values, context),
  apiNames: {
    type: "account_type",
    code: "code",
    name: "name",
    category: "filing_mapping.self_assessment_mtd_category",
  },
});
```

The view. Each binding spreads into an existing `@firna/ui` field, and it
supplies the label:

```tsx
import { FormBody, useForm } from "@firna/ui/form";
import { Input } from "@firna/ui/input";
import { SegmentedControl } from "@firna/ui/segmented";
import { useToast } from "@firna/ui/toast";

export function AddAccountForm({ book }: { book: Book }) {
  const toast = useToast();
  const form = useForm(addAccountForm, {
    context: { selfAssessment: book.kind === "self_assessment_individual" },
    primaryLabel: "Add account",
    failureTitle: "We couldn't add this account",
    write: (request) => createAccount(book.id, request),
    onSuccess: () => toast.toast({ title: "Account added", tone: "success" }),
  });
  return (
    <FormBody form={form}>
      <SegmentedControl {...form.segmented("type")} options={TYPE_OPTIONS} />
      <Input {...form.input("code")} />
      <Input {...form.input("name")} />
      {form.shows("category") ? (
        <CategorySelector {...form.field("category")} />
      ) : null}
    </FormBody>
  );
}
```

The same form in three hosts:

```tsx
// A dialog, from @firna/ui/form-dialog.
<FormDialog title="Add account" visible={open} onClose={() => setOpen(false)}>
  <AddAccountForm book={book} />
</FormDialog>

// A level of the app's own command palette.
<FormPanel
  title="Add account"
  backLabel="Back to Search"
  onBack={canGoBack ? showSearch : undefined}
  onClose={closePalette}
  keyHints={wideWeb}
>
  <AddAccountForm book={book} />
</FormPanel>

// A page section: no title row and no Escape layer. The footer ends the form.
<FormSection onClose={() => router.back()}>
  <CompanyProfileForm company={company} />
</FormSection>
```

The app sets its error adapter once:

```tsx
<FormConfigProvider
  errors={{
    message: (error, fallback) => safeApiMessage(error) ?? fallback,
    fieldErrors: (error) => apiFieldErrors(error), // [["code", "That code is in use."]]
    uncertain: (error) => !isApiError(error) || error.status >= 500,
  }}
>
  <App />
</FormConfigProvider>
```

A stepped form declares its steps and changes its action per step:

```tsx
const steps = useFormSteps([
  { id: "details", label: "Details" },
  { id: "review", label: "Review" },
]);
const details = {
  primaryLabel: "Review",
  write: createDraft,
  success: "stay",
  onSuccess: () => steps.go("review"),
} as const;
const review = { primaryLabel: "Post", write: postDraft, secondary: saveDraft };
const form = useForm(shareIssueForm, {
  ...(steps.current === "details" ? details : review),
  failureTitle: "We couldn't save this share issue",
  draft: heldDraft,
  step: steps.current,
  steps: steps.model,
});
```

### What the model owns

- Values, the fields that the user changed, the submit attempt, server field
  errors, the prerequisite state, and the write state: idle, pending, refused,
  uncertain, or succeeded.
- The visible error of each field, which fields show, the label and the
  required marker, and the first invalid field in reading order.
- The write guard: one write at a time, read synchronously, so a double press,
  Cmd/Ctrl-Enter, or a close request in the same frame cannot start a second
  write or leave the form.
- The form handle that its host reads, and the registration with the nearest
  host.

### Field bindings

| Binding               | Component                     | Value type   | Props it supplies                                                                      |
| --------------------- | ----------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `form.input(f)`       | `Input`, `Textarea`           | `string`     | `value`, `onChangeText`, `error`, `required`, `inputRef`                               |
| `form.date(f)`        | `DateField`                   | ISO `string` | `value`, `onChange`, `error`, `required`, `focusRef`                                   |
| `form.dateRange(f)`   | `DateRangeField`              | `DateRange`  | `value`, `onChange`, `error`, `required`, `focusRef`                                   |
| `form.select(f)`      | `DropdownSelector`            | `string`     | `value`, `onValueChange`, `error`, `required`, `triggerRef`                            |
| `form.segmented(f)`   | `SegmentedControl`            | string union | `value`, `onChange`, `error`, `required`, `focusRef`                                   |
| `form.multiSelect(f)` | `ComboboxMultiSelect`         | `string[]`   | `value`, `onChange`, `error`, `required`, `focusRef`                                   |
| `form.radio(f)`       | `RadioCardGroup`, `RadioCard` | string union | `group`: `error`, `invalid`, `required`, `focusRef`. `option(v)`: `checked`, `onPress` |
| `form.switch(f)`      | `Switch`                      | `boolean`    | `value`, `onValueChange`, `focusRef`                                                   |
| `form.field(f)`       | an app control                | any          | `value`, `onChange`, `error`, `invalid`, `required`, `focusRef`                        |

Each binding except `form.switch` also supplies the field's `label` from the
definition. A view can pass its own `label` after the spread. A binding
accepts only a field whose value type fits its component. The form also
exposes `values`, `shows(field)`, `set(field, value)`, `update(next)`,
`error(field)`, `submit()`, `runWrite(write)`, `failure`, and `handle`.

### Design calls

Each call below is my call, made on 2026-11-04.

1. Every form follows the rules of `docs/protocol/forms.md`, with no per-form
   timing or disable modes, because the task asks for one consistent
   behaviour.
2. Rules are plain functions. The helpers are `required`, `minLength`,
   `maxLength`, and `pattern`, and each takes the form's own message, because
   product copy stays with the app.
3. `schemaRules` adapts a synchronous Standard Schema, such as Zod 3.24 or
   later. The library copies the Standard Schema type and imports no package,
   so Bookfolio's sign-in schemas can move with no dependency. A schema has
   no required flag, so `schemaRules` takes the list of required fields for
   the marker.
4. A `required` rule also sets the field's required marker and
   `aria-required`, so the marker and the rule cannot disagree.
5. A pure form store holds the state and runs the write, and `useForm`
   subscribes to it. The write guard then reads state synchronously, and Node
   unit tests cover the rules with no renderer.
6. A field shows its error after the user changes it or presses the primary,
   until it is valid. A changed field stays changed when its value returns to
   the initial value. Bookfolio's hook works this way, but its doc says
   "differs from its initial value". The hook's rule gives feedback after a
   user clears a required field.
7. The discard guard compares the values with the session's initial values,
   so presets and loaded data are not dirty.
8. A prerequisite is one typed state: loading, failed with Try again, or
   missing with a recovery action. The body renders it and the primary is
   disabled, so a disabled primary never stands alone. The loading state
   shows skeleton fields with the labels of the definition.
9. The app gives one error adapter for the safe message, the field entries,
   and an uncertain outcome. Without an adapter every failure counts as
   uncertain, because the contract never repeats a write that may have
   reached the server. The first failed write without an adapter raises a
   `devWarn` that names the missing adapter.
10. `idempotent: true` lets Try again resend the same request after an
    uncertain failure, as the contract allows for a documented idempotent
    write.
11. On success the host closes, then `onSuccess` runs. With `success: "stay"`
    the form stays open, runs `onSuccess` at once, and takes the saved values
    as its new initial values. A write that settles after its form unmounted
    runs no `onSuccess`. A form then never toasts or navigates while it is
    mounted.
12. `useForm` registers the form with the nearest host through context, so a
    form passes no handle callback. Two forms in one host raise a `devWarn`.
13. The definition maps each step id to its fields, `useFormSteps` holds the
    active step, and the store validates only that step's fields. The handle
    keeps the step model and the held server draft with its ownership, because
    the palette needs them on any host.
14. `DateField`, `DateRangeField`, `SegmentedControl`, `RadioCardGroup`,
    `Switch`, and `ComboboxMultiSelect` get an optional `focusRef`. `Input`
    keeps `inputRef`, and `DropdownSelector` keeps `triggerRef`. A ref works
    on web and native, unlike Bookfolio's wrapper that searches the DOM.
15. A date field's focus target focuses its input without opening the
    calendar. On native, a picker's focus target moves screen-reader focus to
    its trigger where the platform allows it.
16. Initial focus goes to the first shown field in reading order that is not
    a date or multi-select field. The contract keeps pickers out of initial
    focus, and the dropdown contract opens a multi-select's list on focus.
17. `RadioCardGroup` gets an `error` prop, because each field error renders
    through the field's own `error` prop.
18. The hosts are `FormPanel` for overlay levels such as a palette form level,
    `FormSection` for a form inside a page, and `FormDialog` for a modal.
    `FormPanel` has the title row, a scrolling body, and an Escape layer.
    `FormSection` has none of them, so a page keeps its own scroll and
    Escape. `useFormHost` and `FormFooter` serve custom hosts.
19. `@firna/ui/form` holds the model, the hook, the bindings, the body pieces,
    `FormPanel`, and `FormSection`. `@firna/ui/form-dialog` holds
    `FormDialog`. The package declares no `sideEffects`, so the split keeps the
    modal code out of forms that never open in a dialog.
20. The contract's English text ships as defaults, such as "Discard your
    changes?", "Keep editing", "Discard", "Try again", "Cancel", "Step n of
    m", and "Back to {step}". `FormConfigProvider` overrides each one,
    because the library takes labels from consumers.
21. The handle carries Bookfolio's declaration flag, `acceptanceMissing`. An
    unaccepted declaration is not field validity, so the protocol states it
    as the one case where an unfinished form disables the primary. The
    check-row footer stays in Bookfolio, because only its filing forms use
    it.
22. `FormPanel` reports handle changes through `onHandleChange`, so an app can
    keep its own palette URL in step with a held draft.
23. `docs/protocol/forms.md` is a new doc. This plan does not change
    `docs/protocol/shared-ui-components.md`, because that doc passes the
    length target and a split is its own change. Its Non-Goals exclude only
    app-specific state, which the model does not hold.
24. Every change adds API, so the commits use `feat(form):` and the release
    is a minor version.
25. Misuse warns through `devWarn`: a binding for a field that the definition
    does not list, a submit that finds an invalid field with no focus target,
    two forms in one host, a rule on a switch field, and a failed write with
    no error adapter.
26. The definition can hold each field's label. The bindings supply it, and
    the loading skeleton shows it, so the label lives in one place.
27. The definition can say when a field shows. `form.shows(field)` gives the
    view the same condition. A hidden field skips its rules, its required
    marker, and focus, so the view and the rules cannot disagree.
28. A field value can have any type. A group of values, such as a transaction
    treatment, is one field with an object value. A list is one field with an
    array value. Each has one error and one focus target. Row-level errors
    wait for option F.
29. `apiNames` can be a function of the values and the context, because some
    forms send different request fields in different modes.
30. `form.runWrite(write)` runs an extra write, such as a setup record, under
    the same write guard. The form stays held while it runs.
31. A `Switch` has no error message, so a switch field takes no rule. A
    required acceptance uses the declaration flag instead.
32. `form.dateRange` adds the range field's start-before-end check to the
    field's rules, with the field's own message. A submit then cannot write a
    range that the field marks invalid.
33. `FormDialog` on a native bottom sheet asks the leave decision before the
    sheet animates closed. The sheet keeps its footer outside the scrolling
    body, so the primary and the guard stay in view.

## Milestone 1: Documentation and protocol

Depends on: none

Write the requirements and the decisions in force for forms built with the
library. The design above stays in this plan.

- [ ] Add `docs/protocol/forms.md`. State each rule once, and name no source
      file. Cover these sections:
  - [ ] Scope: forms built with the model, on any host.
  - [ ] Form model: values, fields in reading order, labels, when a field
        shows, rules with one short sentence each, a request built only from
        valid values, and API names for server field errors. A group of
        values or a list is one field with one error.
  - [ ] Field errors: hidden on first render, shown after a change or a
        submit attempt until valid, dependent fields, hidden fields, server
        field errors until the field changes, and the form-level message.
  - [ ] Submit: the primary stays enabled while fields are invalid, an invalid
        submit focuses the first invalid field, one write at a time, the
        states that disable the primary, the declaration case, the busy
        label, and the locked fields during a write.
  - [ ] Failed writes: one notice above the fields, refused and uncertain
        outcomes, the default for an unknown failure, and the idempotent
        retry.
  - [ ] Success: close and then the outcome, or stay open with new initial
        values.
  - [ ] Leaving: the leave decision for every in-app exit, the discard guard
        and its focus, and temporary and kept drafts.
  - [ ] Hosts and footer: action order, the compact stack, key hints,
        Cmd/Ctrl-Enter scope, initial focus, and which hosts own Escape.
  - [ ] Steps: the marker, step Back, Escape, close sources, focus per step,
        and errors per step.
  - [ ] Field focus targets: every bound field exposes one, and it opens no
        picker except where the dropdown contract says so.
  - [ ] Accessibility: the names of Back, Close, and the step marker, and the
        announcements of the guard and the notice.
- [ ] Put the decisions in force next to their requirements: no runtime
      dependency, field validity never disables the primary, an unknown
      failure counts as uncertain, and palette search and URLs stay in apps.
- [ ] Keep the doc near 250 lines.
- [ ] Add to the modal contract in `docs/protocol/web-overlays.md`: a host can
      refuse a close request before a native bottom sheet starts to close,
      and the sheet keeps its footer outside the scrolling body.

## Milestone 2: Field focus targets

Tags: ui

Depends on: 1

Give each field that the model binds a focus target. Give `RadioCardGroup` an
error message.

- [ ] Add `focusRef` to `DateField` and `DateRangeField`. It focuses the
      field's input without opening the calendar. A range focuses its start
      input.
- [ ] Export the range field's start-before-end check with its message from
      the date module, so the form model uses the same rule and text.
- [ ] Add `focusRef` to `SegmentedControl`. It focuses the selected segment,
      or the first enabled segment when none is selected.
- [ ] Add `focusRef` and `error` to `RadioCardGroup`. The ref focuses the
      group's roving tab stop. The error renders under the group, marks it
      invalid, and joins its description.
- [ ] Add `focusRef` to `Switch` and `ComboboxMultiSelect`.
- [ ] On native, move screen-reader focus to a picker's trigger where the
      platform allows it.
- [ ] Add a browser spec that calls each focus target from a story. It checks
      the focused element, and it checks that no calendar opened.
- [ ] Add the radio group error to the radio story. Record its baselines on
      Linux.
- [ ] Update the README of each changed component family.

## Milestone 3: Form model core

Depends on: 1

Add the model with no React: the definition, the rules, the field errors, the
form store, and the pure host decisions.

- [ ] Add `defineForm`, `required`, `minLength`, `maxLength`, and `pattern`
      in `src/form/`. The definition takes `initialValues`, `fields`,
      `labels`, `show`, `rules`, `validate`, `derive`, `request`,
      `apiNames` as a map or a function, and `steps`.
- [ ] Add `schemaRules` with a copied Standard Schema v1 type and a list of
      required fields. An asynchronous schema result raises a `devWarn` and
      gives no field errors.
- [ ] Add the field error rules: the visible error, hidden fields, the first
      invalid field, the range order check, and server field binding through
      `apiNames`.
- [ ] Add the form store: values, changed fields, the attempt, server errors,
      the prerequisite, the write state, sessions, `derive`, step-scoped
      validation, the secondary action, `runWrite`, `success`, and
      `idempotent`.
- [ ] Port the pure host decisions from Bookfolio: leave, discard, Escape,
      the step marker, the step Back target, and the footer actions.
- [ ] Add the `FormHandle`, `FormDraft`, `FormSteps`, and `FormPrerequisite`
      types.
- [ ] Add the `devWarn` cases of design call 25 that the store can see.
- [ ] Add unit tests in `tests/unit/form*.test.ts` for each store rule of
      Milestone 1. See each new test fail first.
- [ ] Add `@firna/ui/form` to the `exports` map and to `src/index.ts`.
      Update the package export test and the package smoke test.
- [ ] Add `src/form/README.md` with the model API.

## Milestone 4: The hook and the field bindings

Tags: ui

Depends on: 2, 3

Connect the store to React and to the field components.

- [ ] Add `useForm` on the store with `useSyncExternalStore`.
- [ ] Add the bindings of the table above, with the labels, `values`,
      `shows`, `set`, `update`, `error`, `submit`, `runWrite`, `failure`, and
      `handle`.
- [ ] Make the inputs ignore changes while a write is pending.
- [ ] Add `FormConfigProvider` with the error adapter and the copy
      overrides.
- [ ] Add the host context, the form registration, and `useFormSteps`.
- [ ] Add a type test with `@ts-expect-error` lines for bindings of the wrong
      value type. Both typechecks must compile it.
- [ ] Update `src/form/README.md`.

## Milestone 5: Form body, panel, and section

Tags: ui

Depends on: 4

Add the pieces that every host renders, and the panel and section hosts.

- [ ] Add `FormBody`: the prerequisite states with labelled skeleton fields,
      the failed-write notice above the fields, and the lock during a write.
      The web lock is a `fieldset` with `inert`. The native lock blocks
      touches and hides the fields from screen readers.
- [ ] Add `FormWriteNotice` with a tinted fill and a uniform border, and no
      accent bar. It shows the title, the detail, the unbound entries, and Try
      again or the recovery action. Screen readers announce it.
- [ ] Add `FormDiscardGuard`, `FormFooter`, and `FormStepMarker`.
- [ ] Add `useFormHost` and `FormHostProvider` for custom hosts: the leave
      decision, the guard, Cmd/Ctrl-Enter inside the host only, and initial
      focus.
- [ ] Add `FormPanel`: the optional title row with Back, title, step marker,
      and Close, the purpose line, the scrolling body, the guard, the footer
      with wide-web key hints, the Escape layer, `controlRef` with
      `requestClose`, and `onHandleChange`.
- [ ] Add `FormSection`: the form, the guard, and the footer, with no title
      row, no scrolling body, and no Escape layer.
- [ ] Add stories under `Form/Examples`: a panel form, a page section form, a
      stepped form with a held draft, a refused write with a server field
      error, an uncertain failure, a missing prerequisite, and a pending
      write. Each write is a local promise in the story.
- [ ] Add a story shaped like Bookfolio's Add transaction: a mode switch that
      changes the shown fields and the API names, a value derived from loaded
      data, a grouped treatment field, and a setup write through
      `runWrite`.
- [ ] Add `tests/browser/form.spec.ts` for the panel and section hosts:
  - [ ] An empty submit shows every error and focuses the first invalid
        field.
  - [ ] A refused write keeps the values and shows the notice, Try again,
        and the server field error.
  - [ ] A dirty form raises the guard on Escape and on Close, and Keep
        editing takes focus.
  - [ ] A pending write blocks every close source and locks the fields.
  - [ ] Cmd/Ctrl-Enter runs only an enabled primary, and only inside the
        host.
  - [ ] Escape on a later step goes back one step, and focus moves to the
        step's target.
  - [ ] In a page section, Escape does not run the leave decision.
- [ ] Run each new browser test 10 times, and record the pass count under
      `.context/form-model/`.
- [ ] Record the snapshot baselines of the new stories on Linux. Run the axe
      sweep.
- [ ] Update `src/form/README.md`.

## Milestone 6: Form dialog

Tags: ui

Depends on: 5

Add the dialog host in its own entry point, and the native sheet changes that
it needs.

- [ ] Let a modal host refuse a close request before a native bottom sheet
      starts to close.
- [ ] Keep the footer of a native bottom sheet outside its scrolling body.
- [ ] Add `@firna/ui/form-dialog` with `FormDialog` on `WebModalFrame`: the
      footer with Cancel, the secondary, and the primary, the guard above the
      footer, close blocked during a write, an Escape layer for step Back,
      Cmd/Ctrl-Enter inside the dialog only, and initial focus on web and
      native.
- [ ] Add the entry to the `exports` map and to `src/index.ts`. Update the
      package export test and the package smoke test.
- [ ] Add a dialog story under `Form/Examples` and its baselines.
- [ ] Add the dialog cases to `tests/browser/form.spec.ts`, and run them 10
      times.
- [ ] Document the entry in `src/form/README.md`. Update the modal and sheet
      READMEs for the close request and the footer.

## Milestone 7: Consumer docs

Depends on: 5, 6

- [ ] Add the form model to the root `README.md`, under Key Features and
      User-Facing Interface.
- [ ] Add a Forms section to `docs/consumer-migration.md` that maps
      Bookfolio's `ts/app/src/forms/`, `FormDialog`, `FormActions`,
      `FieldFocusTarget`, and palette form level to the library API.
- [ ] Check `docs/protocol/forms.md` against the built behaviour. Change the
      side that is wrong, as the `documentation` skill says.

## Milestone 8: Verification, commit, review, and pull request

Depends on: every other milestone

- [ ] Run the targeted tests and the complete gate, `cargo xtask check`.
- [ ] Commit with Conventional Commits and push the branch.
- [ ] Review the complete local diff against `origin/main` with the
      `implementation-review` skill after the push. Report the findings,
      then apply the fix rule: fix the `fix now` findings, record follow-up
      items under `plans/follow-ups/` for the rest, re-review once, and
      report.
- [ ] Delete this plan when the `plans` skill says, under "Deleting the
      plan".
- [ ] Open the pull request. Its description gives the decisions and the
      design calls of this plan with their dates, a permalink to this plan,
      and the follow-up items that the change adds.

## Post-merge follow-up (non-blocking)

- [ ] Write the Bookfolio adoption plan in `futex-ai/accounting`. It moves
      `ts/app/src/forms/`, its dialog and page hosts, and its palette form
      level onto the released model. It builds on
      `plans/follow-ups/adopt-web-modal-stack-in-accounting.md`.
- [ ] Write the Firna adoption plan for its feedback form.
- [ ] After Bookfolio adopts the release, smoke-test one palette form and one
      dialog form on a phone and on desktop.
