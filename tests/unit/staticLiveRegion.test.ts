import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LIVE_REGION_ATTRIBUTE } from "../../src/liveRegion";

import { loadBuiltUi, testBuilt } from "./builtUi";
import { tagWith } from "./staticMarkup";

/**
 * Server-rendered markup of the toast live region, from the built web output
 * (`npm run test:dist`). It carries the live-region marker, so an open web
 * modal leaves it exposed.
 */
test(
  "the toast live region carries the live-region marker",
  { skip: !testBuilt },
  async () => {
    const { ToastLiveRegion } = await loadBuiltUi();
    const markup = renderToStaticMarkup(
      createElement(ToastLiveRegion, { testID: "toast-live", toasts: [] }),
    );
    assert.match(
      tagWith(markup, 'data-testid="toast-live"'),
      new RegExp(`${LIVE_REGION_ATTRIBUTE}="true"`),
    );
  },
);
