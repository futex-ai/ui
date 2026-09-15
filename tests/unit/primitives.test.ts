import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const srcRoot = new URL("../../src/", import.meta.url);
const primitivesRoot = new URL("primitives/", srcRoot);

/** Names bound by every `export { ... } from` / `export const|type` in a module. */
function exportedNames(fileName: string): string[] {
  const source = readFileSync(new URL(fileName, primitivesRoot), "utf8");
  const names = new Set<string>();
  for (const block of source.matchAll(/export(?: type)? \{([^}]*)\} from/g)) {
    for (const entry of block[1].split(",")) {
      const name = entry
        .trim()
        .replace(/^type /, "")
        .split(/\s+as\s+/)
        .pop();
      if (name) names.add(name);
    }
  }
  for (const decl of source.matchAll(
    /^export (?:declare )?(?:const|type|namespace) ([A-Za-z0-9_]+)/gm,
  )) {
    names.add(decl[1]);
  }
  if (/export default /.test(source) || /\bdefault,?\s*\}/.test(source)) {
    names.add("default");
  }
  return [...names].sort();
}

test("web and native primitive modules export the same names", () => {
  for (const [nativeFile, webFile] of [
    ["reactNative.ts", "reactNative.web.ts"],
    ["svg.ts", "svg.web.tsx"],
    ["icons.ts", "icons.web.ts"],
  ]) {
    assert.deepEqual(
      exportedNames(webFile),
      exportedNames(nativeFile),
      `${webFile} mirrors ${nativeFile}`,
    );
  }
});

test("web primitives delegate to web packages and native ones to native packages", () => {
  const web = readFileSync(
    new URL("reactNative.web.ts", primitivesRoot),
    "utf8",
  );
  assert.match(web, /from "react-native-web"/);
  assert.match(web, /import type \* as ReactNative from "react-native"/);
  assert.doesNotMatch(web, /^import (?!type)[^;]*from "react-native";/m);

  const webIcons = readFileSync(
    new URL("icons.web.ts", primitivesRoot),
    "utf8",
  );
  assert.match(webIcons, /from "lucide-react"/);
  assert.doesNotMatch(webIcons, /from "lucide-react-native"/);

  const webSvg = readFileSync(new URL("svg.web.tsx", primitivesRoot), "utf8");
  assert.doesNotMatch(webSvg, /from "react-native/);
  assert.match(webSvg, /<svg/);

  assert.match(
    readFileSync(new URL("reactNative.ts", primitivesRoot), "utf8"),
    /from "react-native"/,
  );
  assert.match(
    readFileSync(new URL("svg.ts", primitivesRoot), "utf8"),
    /from "react-native-svg"/,
  );
  assert.match(
    readFileSync(new URL("icons.ts", primitivesRoot), "utf8"),
    /from "lucide-react-native"/,
  );
});

test("no component imports react-native, react-native-svg, or lucide directly", () => {
  const offenders: string[] = [];
  const direct =
    /from\s+["'](react-native|react-native-web|react-native-svg|lucide-react|lucide-react-native)["']|import\(["']react-native["']\)/;
  for (const file of walk(srcRoot.pathname)) {
    if (file.includes("/src/primitives/")) continue;
    if (!/\.(ts|tsx)$/.test(file)) continue;
    if (direct.test(readFileSync(file, "utf8"))) {
      offenders.push(file.slice(srcRoot.pathname.length));
    }
  }
  assert.deepEqual(offenders, []);
});

test("the icon type accepts both Lucide packages' icons", () => {
  const source = readFileSync(new URL("iconTypes.ts", primitivesRoot), "utf8");
  assert.match(
    source,
    /export type IconComponent = ComponentType<IconComponentProps>/,
  );
  for (const prop of ['"aria-hidden"?', "color?", "size?", "strokeWidth?"]) {
    assert.ok(source.includes(prop), `IconComponentProps declares ${prop}`);
  }
  const rootIndex = readFileSync(new URL("index.ts", srcRoot), "utf8");
  assert.match(
    rootIndex,
    /IconComponent, IconComponentProps \} from "\.\/primitives"/,
  );
});

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
