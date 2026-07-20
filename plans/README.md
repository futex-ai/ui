# Plans

## Active

- [SortableList component](sortable-list-component.md) — M1 delivered (web pointer + keyboard drag, optional start/end grab handle, vertical/horizontal flow) and `npm run verify` green; M2 (native drag / touch reordering + RTL) deferred.
- [Easier Component Testing Without Test Ids](easier-component-testing-without-testid.md) — Milestones 1–3 (dropdown, radio, segmented) delivered and `npm run verify` green; Milestones 4–8 remaining.
- [WCAG 2.1 AA Accessibility](wcag-2-1-accessibility.md) — Phases 0–2 delivered (automated gate green, empty `axe-baseline.json`); remaining: the manual screen-reader / 200% zoom / forced-colors release pass in §7 and the AAA/2.2 best-practice backlog.

## Completed

- [Rich Text Editor component](rich-text-editor-component.md) — delivered: the Notion/Linear-style `RichTextEditor` (`src/rich-text`, `@firna/ui/rich-text`) — contentEditable block editor with markdown in/out, prefix shortcuts, caret-anchored `/` menu, inline formatting + autoformat, snapshot undo/redo, native markdown-textarea fallback. M1–M3 complete, `npm run verify` green, live Storybook smoke passed; M4 (links, nested lists, code-block language, drag handles, native rich editing) is the post-v1 backlog.
- [Data Grid component](data-grid-component.md) — delivered: the Airtable/Notion-style editable `DataGrid` primitive (cell-range drag + keyboard selection, virtualized infinite scroll, column menus, add column/row, typed editable cells, responsive card stack). M1–M9 complete and `npm run verify` green; the on-device native pass (M7) is the one deferred manual item.
- [Firna UI Npm Release](firna-ui-npm-release.md)
- [Shared Dropdown And Modal Library](shared-dropdown-modal-library.md)
