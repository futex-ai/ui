import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Library components that own a pointer gesture mark their gesture root with
 * the drag-select ignore marker, so a page-wide `DragSelectableProvider`
 * never starts a box over them. The data grid and the sortable list are
 * covered by a browser test on the "Page shell" story; this list pins the
 * marker on every surface at the source. The video-editor `Scrubber` and the
 * timeline ruler are `slider`s on web, which the field rule already refuses,
 * and the chart scrub hook is native-only, so neither needs a marker.
 */
const MARKED_SURFACES = [
  ["calendar/TimeGrid.tsx", "{...dragSelectableIgnoreProps}"],
  ["calendar/MonthView.tsx", "{...dragSelectableIgnoreProps}"],
  ["data-grid/DataGrid.tsx", "{...dragSelectableIgnoreProps}"],
  ["kanban/Kanban.tsx", "{...dragSelectableIgnoreProps}"],
  ["sortable-list/SortableList.tsx", "{...dragSelectableIgnoreProps}"],
  ["timeline/Timeline.tsx", "{...dragSelectableIgnoreProps}"],
  [
    "video-editor/NumberScrubber.tsx",
    "{...withDragSelectableIgnore(focus.focusRingProps)}",
  ],
] as const;

test("library gesture surfaces carry the drag-select ignore marker", () => {
  for (const [file, marker] of MARKED_SURFACES) {
    const source = readFileSync(
      new URL(`../../src/${file}`, import.meta.url),
      "utf8",
    );
    assert.ok(source.includes(marker), `${file} marks its gesture root`);
    assert.match(
      source,
      /from "\.\.\/drag-select\/dragSelectableIgnore"/,
      `${file} imports the marker`,
    );
  }
});

test("slider surfaces rely on the field rule instead of the marker", () => {
  for (const file of [
    "video-editor/Scrubber.tsx",
    "timeline/TimelineRuler.tsx",
  ]) {
    const source = readFileSync(
      new URL(`../../src/${file}`, import.meta.url),
      "utf8",
    );
    assert.match(source, /sliderRoleProps\(web\)/, `${file} is a web slider`);
  }
});
