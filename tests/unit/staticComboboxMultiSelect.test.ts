import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { loadBuiltUi, testBuilt } from "./builtUi";

test(
  "static locked chips render without a remove button",
  { skip: !testBuilt },
  async () => {
    const { ComboboxMultiSelect } = await loadBuiltUi();
    const markup = renderToStaticMarkup(
      createElement(ComboboxMultiSelect, {
        label: "Tags",
        lockedValues: ["flat2"],
        onChange: () => undefined,
        options: [
          {
            group: "Properties",
            label: "Flat 2, 14 Brook Street",
            value: "flat2",
          },
          { group: "Vehicles", label: "Renault Kangoo BX19 KLM", value: "van" },
        ],
        values: ["flat2", "van"],
      }),
    );
    assert.match(markup, />Flat 2, 14 Brook Street</);
    assert.doesNotMatch(markup, /aria-label="Remove Flat 2, 14 Brook Street"/);
    assert.match(markup, /aria-label="Remove Renault Kangoo BX19 KLM"/);
    // The lock that replaces the button is decorative.
    assert.match(markup, /<div aria-hidden="true"[^>]*><svg[^>]*lucide-lock/);
  },
);

test(
  "static grouped list labels its groups and keeps pinned rows in the listbox",
  { skip: !testBuilt },
  async () => {
    const { DropdownList } = await loadBuiltUi();
    const markup = renderToStaticMarkup(
      createElement(DropdownList, {
        entries: [
          { group: true, id: "g0", label: "Properties", type: "section" },
          {
            id: "flat2",
            label: "Flat 2",
            locked: true,
            secondary: "UK rental property",
            selected: true,
            type: "item",
          },
          {
            disabled: true,
            focusableWhenDisabled: true,
            id: "skoda",
            label: "Skoda",
            secondary: "Consultancy trade",
            type: "item",
          },
        ],
        footerEntries: [{ id: "create", label: "Create tag", type: "item" }],
        label: "Tags",
        listId: "tags",
        maxHeight: 320,
        onClose: () => undefined,
      }),
    );
    assert.match(
      markup,
      /<div aria-labelledby="tags-group-g0" role="group"[^>]*><div id="tags-group-g0"[^>]*>Properties<\/div>/,
    );
    // Locked: selected and disabled, described by its secondary line.
    assert.match(
      markup,
      /aria-describedby="tags-row-flat2-description" aria-label="Flat 2" aria-selected="true" aria-disabled="true" role="option"/,
    );
    assert.match(
      markup,
      /id="tags-row-flat2-description"[^>]*>UK rental property</,
    );
    assert.match(
      markup,
      /aria-label="Skoda" aria-selected="false" aria-disabled="true"/,
    );
    // The pinned row is an option inside the listbox element, after the rows.
    const listbox = markup.indexOf('role="listbox"');
    const pinned = markup.indexOf('id="tags-row-create"');
    assert.ok(listbox >= 0 && pinned > markup.indexOf('id="tags-row-skoda"'));
    assert.equal(markup.match(/role="listbox"/g)?.length, 1);
  },
);
