import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";

import { generateFirnaIconNames } from "../../scripts/rnw-icons";

const packageRoot = resolve("fixture");
const manifest = {
  name: "@fixture/ui",
  exports: {
    ".": { import: "./dist/node/index.js", "react-native": "./dist/index.js" },
    "./list": {
      import: "./dist/node/list/index.js",
      "react-native": "./dist/list/index.js",
    },
    "./rnw": { default: "./dist/rnw.cjs" },
  },
};
const webList = "dist/node/list/List.web.js";
const modules = {
  "dist/node/primitives/icons.web.js":
    'export { Zap, ChevronDown, Check, ArrowUpRight } from "lucide-react";',
  "dist/primitives/icons.js": `
    export { ArrowUpRight, Bell, Bold, Check, CircleCheck, Minus, Plus, Zap }
      from "lucide-react-native";
  `,
  "dist/node/index.js": `
    export * from "./list/index.js";
    export * from "./primitives/icons.web.js";
  `,
  "dist/node/list/index.js": 'export * from "./List.web.js";',
  [webList]: `
    import { ArrowUpRight as NewTab, Check } from "../primitives/icons.web.js";
    export { ArrowUpRight, ChevronDown as Chevron } from "../primitives/icons.web.js";
    // import { MissingIcon } from "../primitives/icons.web.js";
  `,
  "dist/index.js": 'export * from "./list";',
  "dist/list/index.js": 'export * from "./List";',
  "dist/list/List.js": `
    import { ArrowUpRight as NewTab } from "../primitives/icons";
    import "./NativeToolbar";
    import "./PlatformIcon";
    import "./PlatformMenu";
  `,
  "dist/list/List.web.js": 'import { Plus } from "../primitives/icons";',
  "dist/list/NativeToolbar.js": 'import { Bold } from "../primitives/icons";',
  "dist/list/PlatformIcon.js": 'import { Zap } from "../primitives/icons";',
  "dist/list/PlatformIcon.native.js":
    'import { Minus } from "../primitives/icons";',
  "dist/list/PlatformIcon.ios.js":
    'import { Bell } from "../primitives/icons";',
  "dist/list/PlatformMenu.js": 'import { Check } from "../primitives/icons";',
  "dist/list/PlatformMenu.android.js":
    'import { CircleCheck } from "../primitives/icons";',
};

test("the icon generator follows each build tree and merges the native platforms", () => {
  const native = [
    "ArrowUpRight",
    "Bell",
    "Bold",
    "Check",
    "CircleCheck",
    "Minus",
  ];
  assert.deepEqual(generateFirnaIconNames(packageRoot, manifest, fixture()), {
    "@fixture/ui": {
      web: ["ArrowUpRight", "Check", "ChevronDown", "Zap"],
      native,
    },
    "@fixture/ui/list": {
      web: ["ArrowUpRight", "Check", "ChevronDown"],
      native,
    },
    "@fixture/ui/rnw": { web: [], native: [] },
  });
});

test("the icon generator reports a missing seam export by its imported name", () => {
  const readModule = fixture({
    [webList]:
      'export { MissingIcon as ArrowUpRight } from "../primitives/icons.web.js";',
  });
  assert.throws(
    () => generateFirnaIconNames(packageRoot, manifest, readModule),
    /Icon "MissingIcon" imported by .*List\.web\.js is not exported by .*icons\.web\.js/,
  );
});

function fixture(overrides: Record<string, string> = {}) {
  const files = new Map(
    Object.entries({ ...modules, ...overrides }).map(([file, source]) => [
      resolve(packageRoot, file),
      source,
    ]),
  );
  return (file: string) => files.get(file);
}
