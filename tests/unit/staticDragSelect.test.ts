import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { loadBuiltUi, testBuilt } from "./builtUi";

test(
  "drag-select provider exposes provider, target, and listener hooks",
  { skip: !testBuilt },
  async () => {
    const ui = await loadBuiltUi();
    for (const name of [
      "DragSelectableProvider",
      "dragSelectableBox",
      "dragSelectableIdsForBox",
      "dragSelectableOverlayClearsSurface",
      "useDragSelectableChanges",
      "useDragSelectableSelection",
      "useDragSelectableTarget",
    ]) {
      assert.equal(typeof ui[name], "function", `${name} is exported`);
    }
    assert.equal(typeof ui.DRAG_SELECTABLE_LAYERS.overlay, "number");

    let seen:
      | {
          listener: Record<string, unknown>;
          selection: Record<string, unknown>;
          target: {
            a11yProps: Record<string, unknown>;
            dragging: boolean;
            selected: boolean;
          };
        }
      | undefined;
    function Probe() {
      seen = {
        listener: ui.useDragSelectableChanges(() => undefined),
        selection: ui.useDragSelectableSelection(),
        target: ui.useDragSelectableTarget({ id: "row_1", label: "Row 1" }),
      };
      return null;
    }

    const markup = renderToStaticMarkup(
      createElement(
        ui.SharedUiThemeProvider,
        null,
        createElement(
          ui.DragSelectableProvider,
          { accessibilityLabel: "Transactions", testID: "ledger" },
          createElement(Probe),
        ),
      ),
    );

    assert.match(markup, /data-testid="ledger"/);
    assert.match(markup, /aria-label="Transactions"/);
    assert.match(markup, /role="group"/);
    assert.equal(seen?.target.selected, false);
    assert.equal(seen?.target.dragging, false);
    assert.equal(seen?.target.a11yProps.accessibilityRole, "checkbox");
    assert.equal(seen?.target.a11yProps.accessibilityLabel, "Row 1");
    assert.equal(seen?.listener.selectedCount, 0);
    assert.equal(seen?.listener.dragging, false);
    assert.equal(seen?.selection, seen?.listener);
  },
);
