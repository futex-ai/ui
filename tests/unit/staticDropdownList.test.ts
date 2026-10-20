import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { DropdownRowSlot } from "../../src/dropdown/DropdownList";
import type { SharedUiColors } from "../../src/theme";

import { loadBuiltUi, testBuilt } from "./builtUi";
import { elementWith, styleValue, tagWith, textStyle } from "./staticMarkup";

/**
 * Server-rendered markup of `DropdownList`, from the built web output
 * (`npm run test:dist`). The assertions pin what the list renders, not the
 * file that renders it.
 */
async function renderList(props: Record<string, unknown>) {
  const { DropdownList, SharedUiThemeProvider } = await loadBuiltUi();
  return renderToStaticMarkup(
    createElement(
      SharedUiThemeProvider,
      null,
      createElement(DropdownList, {
        label: "Options",
        listId: "list",
        maxHeight: 300,
        onClose: () => undefined,
        ...props,
      }),
    ),
  );
}

async function themeColors(): Promise<SharedUiColors> {
  return (await loadBuiltUi()).defaultSharedUiTheme.colors;
}

test(
  "rows take their accessible name from accessibilityLabel, else the label",
  { skip: !testBuilt },
  async () => {
    const markup = await renderList({
      entries: [
        {
          accessibilityLabel: "Custom start date",
          id: "start",
          label: "Custom",
          type: "item",
        },
        { id: "end", label: "Custom end", type: "item" },
      ],
    });
    assert.match(
      tagWith(markup, 'id="list-row-start"'),
      /aria-label="Custom start date"/,
    );
    assert.match(
      tagWith(markup, 'id="list-row-end"'),
      /aria-label="Custom end"/,
    );
    // The list is one Tab stop: no row takes focus from the Tab key.
    assert.doesNotMatch(markup, /tabindex="0"/);
    assert.match(tagWith(markup, 'id="list-row-start"'), /tabindex="-1"/);
  },
);

test(
  "search, header, and footer content pin outside the scrolling rows",
  { skip: !testBuilt },
  async () => {
    const entries = [{ id: "one", label: "One", type: "item" }];
    const markup = await renderList({
      entries,
      footer: createElement("span", null, "FOOTER"),
      footerEntries: [{ id: "create", label: "PINNED", type: "item" }],
      header: createElement("span", null, "HEADER"),
      search: createElement("span", null, "SEARCH"),
    });
    const listbox = elementWith(markup, 'role="listbox"');
    for (const part of ["SEARCH", "HEADER", "PINNED", "FOOTER"]) {
      assert.equal(listbox.includes(part), false, `${part} is outside`);
    }
    const order = [
      "SEARCH",
      "HEADER",
      'role="listbox"',
      'aria-label="PINNED"',
      "FOOTER",
    ].map((part) => markup.indexOf(part));
    assert.deepEqual(
      order,
      [...order].sort((a, b) => a - b),
    );
    // With pinned content the wrapper owns the height cap and the rows shrink
    // inside it, so the pinned parts keep their natural height.
    assert.equal(
      styleValue(tagWith(markup, 'role="listbox"'), "max-height"),
      undefined,
    );
    assert.ok(
      markup.indexOf("max-height:300px") < markup.indexOf("SEARCH"),
      "the wrapper above the search slot caps the height",
    );
    const plain = await renderList({ entries });
    assert.equal(
      styleValue(tagWith(plain, 'role="listbox"'), "max-height"),
      "300px",
    );
  },
);

test(
  "a solid active row inverts its label, secondary line, and trailing text",
  { skip: !testBuilt },
  async () => {
    const colors = await themeColors();
    const markup = await renderList({
      activeId: "rental",
      entries: [
        {
          id: "rental",
          label: "Rental income",
          rightText: "4020",
          secondary: "Property",
          type: "item",
        },
        {
          id: "sales",
          label: "Sales",
          rightText: "4000",
          secondary: "Trade",
          type: "item",
        },
      ],
    });
    assert.equal(
      styleValue(tagWith(markup, 'id="list-row-rental"'), "background-color"),
      colors.primary,
    );
    for (const text of ["Rental income", "Property", "4020"]) {
      assert.equal(textStyle(markup, text, "color"), colors.onSolid, text);
    }
    assert.equal(textStyle(markup, "Sales", "color"), colors.ink);
    assert.equal(textStyle(markup, "Trade", "color"), colors.muted);
    assert.equal(textStyle(markup, "4000", "color"), colors.muted);
  },
);

test(
  "a danger row takes the deep rose fill when active and a rose label at rest",
  { skip: !testBuilt },
  async () => {
    const colors = await themeColors();
    const markup = await renderList({
      activeId: "remove",
      entries: [
        { id: "remove", label: "Remove", tone: "danger", type: "item" },
        { id: "archive", label: "Archive", tone: "danger", type: "item" },
      ],
      listRole: "menu",
    });
    assert.equal(
      styleValue(tagWith(markup, 'id="list-row-remove"'), "background-color"),
      colors.roseDeep,
    );
    assert.equal(textStyle(markup, "Remove", "color"), colors.onSolid);
    assert.equal(textStyle(markup, "Archive", "color"), colors.rose);
  },
);

test("each row forwards its testID", { skip: !testBuilt }, async () => {
  const markup = await renderList({
    entries: [{ id: "a", label: "A", testID: "row-a", type: "item" }],
  });
  assert.match(tagWith(markup, 'id="list-row-a"'), /data-testid="row-a"/);
});

test(
  "a trailing rightText or right slot replaces the selection check",
  { skip: !testBuilt },
  async () => {
    const markup = await renderList({
      activeId: null,
      entries: [
        { id: "plain", label: "Plain", selected: true, type: "item" },
        {
          id: "coded",
          label: "Coded",
          rightText: "4020",
          selected: true,
          type: "item",
        },
        {
          id: "slotted",
          label: "Slotted",
          right: createElement("span", null, "R"),
          selected: true,
          type: "item",
        },
      ],
    });
    const row = (id: string) => elementWith(markup, `id="list-row-${id}"`);
    assert.match(row("plain"), /lucide-check/);
    assert.doesNotMatch(row("coded"), /lucide-check/);
    assert.doesNotMatch(row("slotted"), /lucide-check/);
  },
);

test(
  "row slots render against the row's content color",
  { skip: !testBuilt },
  async () => {
    const colors = await themeColors();
    // Both slot forms type-check: a render function given the row's content
    // color, and a plain node that passes through untouched.
    const colorSlot: DropdownRowSlot = ({ color }) =>
      createElement("span", { "data-slot": color });
    const nodeSlot: DropdownRowSlot = createElement("span", {
      "data-node": "kept",
    });
    const markup = await renderList({
      activeId: "active",
      entries: [
        {
          id: "active",
          label: "Active",
          leading: colorSlot,
          right: colorSlot,
          type: "item",
        },
        { id: "rest", label: "Rest", leading: colorSlot, type: "item" },
        {
          id: "picked",
          label: "Picked",
          leading: colorSlot,
          selected: true,
          type: "item",
        },
        { id: "node", label: "Node", leading: nodeSlot, type: "item" },
      ],
    });
    const row = (id: string) => elementWith(markup, `id="list-row-${id}"`);
    const slotColors = (id: string) =>
      [...row(id).matchAll(/data-slot="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(slotColors("active"), [colors.onSolid, colors.onSolid]);
    assert.deepEqual(slotColors("rest"), [colors.ink]);
    assert.deepEqual(slotColors("picked"), [colors.primaryDeep]);
    assert.match(row("node"), /data-node="kept"/);
  },
);

test(
  "section groups render only when groupSections is on",
  { skip: !testBuilt },
  async () => {
    const entries = [
      { id: "g", label: "Vehicles", type: "section" },
      { id: "van", label: "Van", type: "item" },
    ];
    assert.doesNotMatch(await renderList({ entries }), /role="group"/);
    const grouped = await renderList({ entries, groupSections: true });
    assert.match(
      tagWith(grouped, 'role="group"'),
      /aria-labelledby="list-section-g"/,
    );
  },
);
