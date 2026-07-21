# Plans

## Active

- [Disable the focus ring](disable-focus-ring.md) — M1–M5 delivered: a theme `focusRing` kill switch + per-instance `disableFocusRing` prop on every ring-bearer, backed by one `useFocusRing({ disabled })` / `ringEnabled` / `webOutlineReset` primitive; disabled rings restore the UA outline (WCAG 2.4.7). Unit tests + a `Focus ring/Examples` story added. Deferred: `DateField`/`DateRangeField` composite forwarding.
- [SortableList component](sortable-list-component.md) — M1 delivered (web pointer + keyboard drag, optional start/end grab handle, vertical/horizontal flow) and `npm run verify` green; M2 (native drag / touch reordering + RTL) deferred.
- [Easier Component Testing Without Test Ids](easier-component-testing-without-testid.md) — Milestones 1–3 (dropdown, radio, segmented) delivered and `npm run verify` green; Milestones 4–8 remaining.
- [WCAG 2.1 AA Accessibility](wcag-2-1-accessibility.md) — Phases 0–2 delivered (automated gate green, empty `axe-baseline.json`); remaining: the manual screen-reader / 200% zoom / forced-colors release pass in §7 and the AAA/2.2 best-practice backlog.

## Completed

- [Rich Text Editor component](rich-text-editor-component.md) — delivered: the cross-platform Notion/Linear-style `RichTextEditor` (`src/rich-text`, `@firna/ui/rich-text`) with canonical markdown, block shortcuts, web caret-anchored `/` commands, inline formatting, snapshot undo/redo, and attributed native block editing with an iOS/Android keyboard toolbar. M1–M4 and M6 complete; M5 tracks links, nested lists, code-block language, and drag handles.
- [Data Grid component](data-grid-component.md) — delivered: the Airtable/Notion-style editable `DataGrid` primitive (cell-range drag + keyboard selection, virtualized infinite scroll, column menus, add column/row, typed editable cells, responsive card stack). M1–M9 complete and `npm run verify` green; the on-device native pass (M7) is the one deferred manual item.
- [Firna UI Npm Release](firna-ui-npm-release.md)
- [Shared Dropdown And Modal Library](shared-dropdown-modal-library.md)
