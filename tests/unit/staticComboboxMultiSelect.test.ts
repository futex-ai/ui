import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { loadBuiltUi, testBuilt } from "./builtUi";

/**
 * Server-rendered markup of the grouped tag picker, from the built web output
 * (`npm run test:dist`). The closed field shows the chips; the option list is
 * rendered through `DropdownList` directly with the rows the picker builds.
 */
const House = (props: Record<string, unknown>) =>
  createElement("svg", { "data-icon": "house", ...props });

const tags = [
  {
    description: "UK rental property",
    group: "Properties",
    icon: House,
    label: "Flat 2, 14 Brook Street",
    value: "flat2",
  },
  {
    chipTone: "muted",
    description: "UK rental property",
    group: "Vehicles",
    label: "Renault Kangoo BX19 KLM",
    value: "van",
  },
];

async function renderField(props: Record<string, unknown>) {
  const { ComboboxMultiSelect, SharedUiThemeProvider } = await loadBuiltUi();
  return renderToStaticMarkup(
    createElement(
      SharedUiThemeProvider,
      null,
      createElement(ComboboxMultiSelect, {
        label: "Tags",
        onChange: () => undefined,
        options: tags,
        placeholder: "Add tag",
        values: ["flat2", "van"],
        ...props,
      }),
    ),
  );
}

/** The opening tag of the first element that carries `attribute`. */
function tagWith(markup: string, attribute: string): string {
  const index = markup.indexOf(attribute);
  assert.ok(index >= 0, `markup has ${attribute}`);
  return markup.slice(
    markup.lastIndexOf("<", index),
    markup.indexOf(">", index),
  );
}

test("locked chips have no remove button", { skip: !testBuilt }, async () => {
  const markup = await renderField({ lockedValues: ["flat2"] });
  assert.doesNotMatch(markup, /aria-label="Remove Flat 2, 14 Brook Street"/);
  assert.match(markup, /aria-label="Remove Renault Kangoo BX19 KLM"/);
  // Without the prop every chip keeps its remove button.
  const unlocked = await renderField({});
  assert.match(unlocked, /aria-label="Remove Flat 2, 14 Brook Street"/);
});

test(
  "chips show the option icon and the muted tone",
  { skip: !testBuilt },
  async () => {
    const { defaultSharedUiTheme } = await loadBuiltUi();
    const markup = await renderField({});
    const icon = tagWith(markup, 'data-icon="house"');
    assert.match(icon, /aria-hidden="true"/);
    assert.match(
      icon,
      new RegExp(`color="${defaultSharedUiTheme.colors.primaryDeep}"`),
    );
    // The archived-style chip takes the neutral fill and text.
    assert.match(
      markup,
      new RegExp(`background-color:${defaultSharedUiTheme.colors.soft}`),
    );
    assert.match(
      markup,
      new RegExp(`color:${defaultSharedUiTheme.colors.ink2}`),
    );
  },
);

test(
  "the sheet presentation shows a dialog trigger instead of the input",
  { skip: !testBuilt },
  async () => {
    const markup = await renderField({ presentation: "sheet" });
    const trigger = tagWith(markup, 'aria-haspopup="dialog"');
    assert.match(trigger, /role="button"|<button/);
    assert.match(trigger, /aria-label="Tags, Add tag"/);
    assert.match(trigger, /aria-expanded="false"/);
    assert.doesNotMatch(markup, /<input/);
    // The popover presentation keeps the search input in the field. (Its
    // combobox role is added on the client, so server markup omits it.)
    assert.match(await renderField({}), /<input[^>]*placeholder="Add tag"/);
  },
);

test(
  "the option list labels groups, marks disabled rows, describes rows, and owns the footer action",
  { skip: !testBuilt },
  async () => {
    const { DropdownList, SharedUiThemeProvider } = await loadBuiltUi();
    const markup = renderToStaticMarkup(
      createElement(
        SharedUiThemeProvider,
        null,
        createElement(DropdownList, {
          entries: [
            { id: "g0", label: "Vehicles", type: "section" },
            {
              id: "van",
              label: "Renault Kangoo BX19 KLM",
              secondary: "UK rental property",
              type: "item",
            },
            {
              disabled: true,
              id: "skoda",
              label: "Skoda Octavia WK21 LMN",
              secondary: "Consultancy trade",
              type: "item",
            },
            {
              disabled: true,
              id: "flat2",
              label: "Flat 2, 14 Brook Street",
              selected: true,
              type: "item",
            },
          ],
          footerEntries: [
            { id: "create", label: "Create tag “van”", type: "item" },
          ],
          groupSections: true,
          label: "Tags",
          listId: "tags",
          maxHeight: 300,
          onClose: () => undefined,
        }),
      ),
    );

    const group = tagWith(markup, 'role="group"');
    assert.match(group, /aria-labelledby="tags-section-g0"/);
    assert.match(markup, /id="tags-section-g0"[^>]*>Vehicles</);

    const skoda = tagWith(markup, 'id="tags-row-skoda"');
    assert.match(skoda, /aria-disabled="true"/);
    assert.match(skoda, /aria-describedby="tags-row-skoda-secondary"/);
    assert.match(
      markup,
      /id="tags-row-skoda-secondary"[^>]*>Consultancy trade</,
    );

    // A locked row is announced as selected and unavailable.
    const locked = tagWith(markup, 'id="tags-row-flat2"');
    assert.match(locked, /aria-selected="true"/);
    assert.match(locked, /aria-disabled="true"/);

    const listbox = tagWith(markup, 'role="listbox"');
    assert.match(listbox, /aria-owns="tags-row-create"/);
    const action = tagWith(markup, 'id="tags-row-create"');
    assert.match(action, /role="option"/);
    assert.match(action, /aria-label="Create tag “van”"/);
  },
);

test(
  "the footer action runs from the keyboard with the trimmed query",
  { skip: !testBuilt },
  async () => {
    const entriesModule = await import(
      new URL(
        "../../dist/node/dropdown/comboboxMultiSelectEntries.js",
        import.meta.url,
      ).href
    );
    const {
      dropdownKeyAction,
      dropdownListNavigationItems,
      nextSelectableId,
      selectedOrFirstId,
    } = await loadBuiltUi();
    const pressed: string[] = [];
    let done = 0;
    const footerEntries = entriesModule.comboboxFooterActionEntries(
      {
        label: (query: string) =>
          query ? `Create tag “${query}”` : "Create tag",
        onPress: (query: string) => pressed.push(query),
      },
      "  van ",
      { actionMark: {} },
      () => {
        done += 1;
      },
    );
    assert.equal(footerEntries[0].label, "Create tag “van”");

    // The same pure steps the combobox hook runs: with no option to choose the
    // action is the first active row, and Enter is the select action.
    const entries = [
      { id: "empty", label: "No matching options", type: "section" },
      ...footerEntries,
    ];
    const items = dropdownListNavigationItems(entries);
    const activeId = selectedOrFirstId(items, null);
    assert.equal(activeId, footerEntries[0].id);
    assert.equal(dropdownKeyAction("Enter"), "select");
    entries.find((entry) => entry.id === activeId)?.onPress();
    assert.deepEqual(pressed, ["van"]);
    assert.equal(done, 1);

    // With options listed, ArrowUp from the first option wraps to the action.
    const withOptions = [
      { id: "van", label: "Renault Kangoo BX19 KLM", type: "item" },
      ...footerEntries,
    ];
    assert.equal(
      nextSelectableId(dropdownListNavigationItems(withOptions), "van", -1),
      footerEntries[0].id,
    );
  },
);
