import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { loadBuiltUi, testBuilt } from "./builtUi";
import { tagWith } from "./staticMarkup";

/**
 * Server-rendered focus markup of `DropdownList`, from the built web output
 * (`npm run test:dist`). A list that is its own Tab stop names its active
 * row, also when the caller passes no `listId`.
 */
test(
  "a list without a listId names its active row with an id of its own",
  { skip: !testBuilt },
  async () => {
    const { DropdownList, SharedUiThemeProvider } = await loadBuiltUi();
    const markup = renderToStaticMarkup(
      createElement(
        SharedUiThemeProvider,
        null,
        createElement(DropdownList, {
          activeId: "copy",
          entries: [
            { id: "copy", label: "Copy", type: "item" },
            { id: "paste", label: "Paste", type: "item" },
          ],
          label: "Cell actions",
          listRole: "menu",
          maxHeight: 300,
          onClose: () => undefined,
        }),
      ),
    );
    const menu = tagWith(markup, 'role="menu"');
    const listId = /\sid="([^"]+)"/.exec(menu)?.[1];
    assert.ok(listId, `the menu has an id: ${menu}`);
    assert.ok(
      menu.includes(`aria-activedescendant="${listId}-row-copy"`),
      `the menu points at its active row: ${menu}`,
    );
    assert.ok(
      markup.includes(`id="${listId}-row-paste"`),
      "each row has an id under the list's id",
    );
  },
);
