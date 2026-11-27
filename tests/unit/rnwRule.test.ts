import assert from "node:assert/strict";
import test from "node:test";

import { resolveFirnaRnwFileInDist } from "../../scripts/rnw-rule";

const dist = "/repo/node_modules/@firna/ui/dist";

test("native RNW forms resolve to the native tree from either build tree", () => {
  const cases = [
    ["node/list/List.js", "../primitives/reactNative.web.js", "reactNative.js"],
    ["list/List.js", "../primitives/reactNative", "reactNative.js"],
    ["node/primitives/link.web.js", "./reactNative.web.js", "reactNative.js"],
    ["list/List.js", "../primitives/reactNative.js", "reactNative.js"],
    [
      "list/List.js",
      "../primitives/../primitives/reactNative.web",
      "reactNative.js",
    ],
  ];
  for (const [importer, request, file] of cases) {
    assert.equal(
      resolveFirnaRnwFileInDist(dist, `${dist}/${importer}`, request),
      `${dist}/primitives/${file}`,
      `${request} from ${importer}`,
    );
  }
});

test("the RNW rule accepts both separator styles in the importing path", () => {
  const windowsDist = String.raw`C:\repo\node_modules\@firna\ui\dist`;
  const windowsFile = String.raw`C:\repo\node_modules\@firna\ui\dist\primitives\reactNative.js`;
  assert.equal(
    resolveFirnaRnwFileInDist(
      windowsDist,
      String.raw`C:\repo\node_modules\@firna\ui\dist\node\list\List.js`,
      "../primitives/reactNative.web.js",
    ),
    windowsFile,
  );
  assert.equal(
    resolveFirnaRnwFileInDist(
      windowsDist,
      "C:/repo/node_modules/@firna/ui/dist/list/List.js",
      "../primitives/reactNative",
    ),
    windowsFile,
  );
  assert.equal(
    resolveFirnaRnwFileInDist(
      dist,
      String.raw`\repo\node_modules\@firna\ui\dist\node\list\List.js`,
      "../primitives/reactNative.web.js",
    ),
    `${dist}/primitives/reactNative.js`,
  );
});

test("the RNW rule leaves other requests to normal resolution", () => {
  const nodeImporter = `${dist}/node/list/List.js`;
  const nativeRequest = "../primitives/reactNative.web.js";
  const cases = [
    ["/app/list/List.js", nativeRequest],
    [
      `${dist}-other/node/list/List.js`,
      "../../../dist/node/primitives/reactNative.web.js",
    ],
    [
      `${dist}/../node/list/List.js`,
      "../../dist/node/primitives/reactNative.web.js",
    ],
    ["dist/node/list/List.js", nativeRequest],
    [nodeImporter, "./reactNative.web.js"],
    [nodeImporter, "../primitives/types"],
    [nodeImporter, "../primitives/link.web.js"],
    [nodeImporter, "../primitives/domBackendCss"],
    [nodeImporter, "../primitives/icons.web.js"],
    [nodeImporter, "../primitives/../primitives/svg.web"],
    [`${dist}/list/List.js`, "../primitives/icons.js"],
    [`${dist}/list/List.js`, "../primitives/svg"],
    [nodeImporter, "../primitives/reactNative/"],
    [nodeImporter, "@firna/ui/primitives/reactNative"],
    [nodeImporter, `${dist}/primitives/reactNative.js`],
  ];
  for (const [importer, request] of cases) {
    assert.equal(
      resolveFirnaRnwFileInDist(dist, importer, request),
      null,
      `${request} from ${importer}`,
    );
  }
});
