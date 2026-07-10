import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolveResponsivePopoverContent } from "../../src/popover/responsivePopoverModel";

test("responsive popover resolves node and render-function children", () => {
  // A plain node passes through untouched.
  const node = "just text";
  assert.equal(
    resolveResponsivePopoverContent(node, {
      close: () => undefined,
      layout: "popover",
      maxHeight: 100,
    }),
    node,
  );

  // A render function receives the per-platform content state.
  let receivedLayout = "";
  let receivedMax = 0;
  const rendered = resolveResponsivePopoverContent(
    (state) => {
      receivedLayout = state.layout;
      receivedMax = state.maxHeight;
      return "rendered";
    },
    { close: () => undefined, layout: "sheet", maxHeight: 240 },
  );
  assert.equal(rendered, "rendered");
  assert.equal(receivedLayout, "sheet");
  assert.equal(receivedMax, 240);
});

test("responsive popover web build composes the dropdown portal and popover surface", () => {
  const source = readSource("../../src/popover/ResponsivePopover.web.tsx");

  assert.match(source, /DropdownPortal/);
  assert.match(source, /PopoverSurface/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /layout: "popover"/);
  // Center alignment falls back to start until the placement engine supports it.
  assert.match(source, /align === "center" \? "start"/);
});

test("responsive popover native build renders the sheet", () => {
  const source = readSource("../../src/popover/ResponsivePopover.tsx");

  assert.match(source, /from "\.\.\/sheet"/);
  assert.match(source, /<Sheet/);
  assert.match(source, /layout: "sheet"/);
});

test("public popover entrypoint exports the responsive popover", () => {
  const source = readSource("../../src/popover/index.ts");

  assert.match(source, /ResponsivePopover/);
  assert.match(source, /responsivePopoverModel/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
