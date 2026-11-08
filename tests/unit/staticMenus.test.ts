/**
 * Static markup of the menus: what a server render or a script-free page
 * shows. Server rendering has no portal and runs no effect, so a menu that
 * waits for either draws nothing here.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { loadBuiltUi, testBuilt } from "./builtUi";

const noop = () => undefined;

type Tag = Record<string, string>;

/** The attributes of every opening tag in `html`, in document order. */
function tags(html: string): Tag[] {
  return [...html.matchAll(/<([a-z]+)((?:\s[^>]*)?)>/g)].map((match) => {
    const attributes: Tag = { tag: match[1] };
    for (const pair of match[2].matchAll(/([\w:-]+)="([^"]*)"/g)) {
      attributes[pair[1]] = pair[2];
    }
    return attributes;
  });
}

/** The one tag that carries every given attribute value. */
function only(html: string, wanted: Tag): Tag {
  const found = tags(html).filter((tag) =>
    Object.entries(wanted).every(([name, value]) => tag[name] === value),
  );
  assert.equal(found.length, 1, `one tag with ${JSON.stringify(wanted)}`);
  return found[0];
}

const sortEntries = [
  { id: "sort-by", label: "Sort by", type: "section" },
  {
    checked: true,
    id: "recent",
    label: "Recent activity",
    onPress: noop,
    type: "item",
  },
  { checked: false, id: "name", label: "Name", onPress: noop, type: "item" },
  { id: "divider", label: "", type: "divider" },
  { id: "note", label: "Pinned projects stay at the top.", type: "note" },
];

const actionEntries = [
  { id: "rename", label: "Rename", onPress: noop, type: "item" },
  { disabled: true, id: "pin", label: "Pin", onPress: noop, type: "item" },
  {
    id: "archive",
    label: "Archive project",
    onPress: noop,
    tone: "danger",
    type: "item",
  },
];

type BuiltUi = Awaited<ReturnType<typeof loadBuiltUi>>;

async function render(element: (ui: BuiltUi) => ReactElement) {
  const ui = await loadBuiltUi();
  return renderToStaticMarkup(
    createElement(ui.SharedUiThemeProvider, null, element(ui)),
  );
}

test(
  "an in-place menu draws open in static HTML on its first enabled row",
  { skip: !testBuilt },
  async () => {
    const html = await render(({ InlineMenu }) =>
      createElement(
        InlineMenu,
        {
          align: "end",
          entries: sortEntries,
          label: "Sort projects",
          onClose: noop,
          open: true,
          size: "xs",
        },
        createElement("button", { type: "button" }, "Sort"),
      ),
    );
    const menu = only(html, { "aria-label": "Sort projects", role: "menu" });
    const recent = only(html, {
      "aria-checked": "true",
      "aria-label": "Recent activity",
      role: "menuitemradio",
    });
    only(html, {
      "aria-checked": "false",
      "aria-label": "Name",
      role: "menuitemradio",
    });
    assert.equal(menu.tabindex, "0");
    assert.equal(menu["aria-activedescendant"], recent.id);
    assert.equal(recent.tabindex, "-1");
    // The note describes the menu.
    const note = tags(html).find((tag) => tag.id === menu["aria-describedby"]);
    assert.ok(note, "the menu description is a note in the menu");
    assert.match(html, /Pinned projects stay at the top\./);
    // The caller's side and edge place it, with no measurement.
    assert.match(html, /position:absolute[^"]*top:100%[^"]*right:0px/);
  },
);

test(
  "a focused list points only at an enabled row, with its own ids when the caller gives none",
  { skip: !testBuilt },
  async () => {
    const list = (props: Record<string, unknown>) =>
      render(({ DropdownList }) =>
        createElement(DropdownList, {
          entries: actionEntries,
          label: "Project actions",
          listRole: "menu",
          maxHeight: 320,
          onClose: noop,
          ...props,
        }),
      );

    // No list id: the list makes one, so the active row has an id to point at.
    const focused = await list({ focusMode: "list" });
    const menu = only(focused, {
      "aria-label": "Project actions",
      role: "menu",
    });
    const rename = only(focused, { "aria-label": "Rename", role: "menuitem" });
    assert.ok(rename.id, "the active row has an id");
    assert.equal(menu["aria-activedescendant"], rename.id);
    assert.equal(menu["data-firna-focus-ring"], undefined);

    // A disabled active row is no keyboard position: the list keeps its own
    // focus glow and points at nothing.
    const disabled = await list({ activeId: "pin", focusMode: "list" });
    const disabledMenu = only(disabled, {
      "aria-label": "Project actions",
      role: "menu",
    });
    assert.equal(disabledMenu["aria-activedescendant"], undefined);
    assert.equal(disabledMenu["data-firna-focus-ring"], "self");

    // The rows mode keeps its markup: no list id, no row ids.
    const rows = await list({});
    assert.equal(
      only(rows, { "aria-label": "Rename", role: "menuitem" }).id,
      undefined,
    );
  },
);

test(
  "the phone menu sheet draws in place as a named dialog that does not claim to be modal",
  { skip: !testBuilt },
  async () => {
    const html = await render(({ InlineMenuSheet }) =>
      createElement(InlineMenuSheet, {
        entries: actionEntries,
        label: "Project actions",
        onClose: noop,
        size: "xs",
        title: "Billing portal",
      }),
    );
    const dialog = only(html, {
      "aria-label": "Project actions",
      role: "dialog",
    });
    // Nothing keeps focus inside a drawing, so it is not a modal dialog.
    assert.equal(dialog["aria-modal"], undefined);
    assert.doesNotMatch(html, /aria-modal/);
    assert.match(html, />Billing portal</);
    only(html, { "aria-label": "Close Billing portal", role: "button" });
    // The sheet opens without an active row, on touch rows.
    const menu = only(html, { "aria-label": "Project actions", role: "menu" });
    assert.equal(menu["aria-activedescendant"], undefined);
    const rename = only(html, { "aria-label": "Rename", role: "menuitem" });
    assert.match(rename.style, /min-height:44px/);
  },
);
