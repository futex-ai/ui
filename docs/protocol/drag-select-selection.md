# Drag Select Selection Rules

The selection rules of `@firna/ui/drag-select` 5.0. They say how a proposal
from a drag or a key becomes the rendered selection, and when the provider
reports and announces a change. The option precedence of the page hook
layers, the start rules, and the gesture are in
[drag-select.md](drag-select.md). The option defaults are in
[the option reference](drag-select-api.md).

- Selection ids are a set. The order of ids carries no meaning. The provider
  compares a proposal with the current selection as sets, and a controlled app
  may keep its ids in any order. An id listed more than once in `selectedIds`
  or `defaultSelectedIds` counts once, at its first position.
- `dragSelectableNextSelection` defines the order of its result: `replace`
  returns the hits. `add` returns the current ids, then the hits that are not
  current. `toggle` returns the current ids without the hits, then the hits
  that were not current. Duplicate ids appear once.
- Keyboard: Space or Enter proposes `toggle` with the focused target. Shift
  with an arrow key proposes `replace` with the range. The source is
  `keyboard`. A disabled provider ignores keyboard changes.
- The provider skips a proposal whose set equals the current set.
- Controlled, when the merged options define `selectedIds`: the provider
  stores nothing. It calls `onSelectedIdsChange(proposal, change)` and renders
  `selectedIds`. A proposal that the app does not apply changes nothing.
- Uncontrolled: the provider starts from `defaultSelectedIds`, applies each
  proposal, and also calls `onSelectedIdsChange`.
- Starting selection: when a page hook becomes the source of `selectedIds` and
  the previous source was not a newer hook, that selection is the page's
  starting selection, which the provider does not report through
  `onSelectionChange` or announce. Later changes report as usual, also the
  return of an older hook's selection when a newer hook stops setting it.
- Scope: `selectionScope` names the page or view that an uncontrolled
  selection belongs to. When the merged value changes, the stored selection
  clears, and the new scope never shows the old selection. A scope that
  comes back later starts empty too. The clear fires `onSelectionChange`
  when the rendered selection changes, and it is not announced. Decision:
  the shell names each page with `selectionScope`, rather than requiring
  unique ids across pages, because two pages can show the same records.
- Last target gone: when the last registered target unregisters and none of
  the selected ids registers again in the same task, the stored selection
  clears. The rule applies with or without a scope. Without a scope, it is the
  rule that clears the selection on a page change. A remount of the same
  targets keeps the selection. In uncontrolled mode the clear fires
  `onSelectionChange` with an empty selection. The clear is not a proposal, so
  it is not announced and `onSelectedIdsChange` does not fire. A filter or a
  reload that leaves zero rows also clears the selection. Decision: the
  provider waits for the end of the task, rather than clearing at once,
  because a development remount of the same rows must keep the selection.
- `onSelectionChange(selection)` fires when the rendered selection changes
  as a set, from any source, except for the initial selection and a page's
  starting selection.
- Announcement: a proposal waits for the next change of the rendered
  selection. When that change makes the rendered selection equal to the
  proposal, the provider announces it through `selectionAnnouncement` (WCAG
  2.1 4.1.3). Otherwise it drops the proposal. A new proposal replaces a
  waiting one. So a change that the app makes on its own, and a proposal
  that the app changes or rejects, are not announced.
- `selectedTargets` is a snapshot of the registrations of the selected ids.
  The provider takes it when the rendered selection or the set of registered
  targets changes, with the target data current at that moment. An id with
  no registered target has `data: undefined`. Consumers that need live data
  map `selectedIds` through their own source.
