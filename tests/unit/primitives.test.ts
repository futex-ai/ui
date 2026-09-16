import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
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
    ["svg.tsx", "svg.web.tsx"],
    ["icons.ts", "icons.web.ts"],
  ]) {
    assert.deepEqual(
      exportedNames(webFile),
      exportedNames(nativeFile),
      `${webFile} mirrors ${nativeFile}`,
    );
  }
});

/**
 * TypeScript applies `moduleSuffixes` *inside* each extension rather than the
 * other way round: resolving `./svg` under `tsconfig.web.json` it tries
 * `svg.web.ts`, then `svg.ts`, only then `svg.web.tsx`. A `.web.tsx` file whose
 * native sibling is a plain `.ts` therefore loses the race, and
 * `npm run typecheck:web` would silently check the native module — which is how
 * `svg.web.tsx` went unchecked before `svg.ts` was renamed to `svg.tsx`.
 * Bundlers (Vite, Metro) resolve the suffix first, so only the type-check is
 * affected, which is exactly what makes the trap quiet.
 */
test("every .web module wins its own module-resolution race", () => {
  const order = [".ts", ".tsx"];
  const offenders: string[] = [];
  for (const file of walk(srcRoot.pathname)) {
    const webExtension = extname(file);
    const base = file.slice(0, -`.web${webExtension}`.length);
    if (
      !file.endsWith(`.web${webExtension}`) ||
      !order.includes(webExtension)
    ) {
      continue;
    }
    for (const nativeExtension of order) {
      if (
        existsSync(`${base}${nativeExtension}`) &&
        order.indexOf(webExtension) > order.indexOf(nativeExtension)
      ) {
        offenders.push(
          `${file.slice(srcRoot.pathname.length)} is shadowed by its ${nativeExtension} sibling`,
        );
      }
    }
  }
  assert.deepEqual(offenders, []);
});

/**
 * The names the web seam still takes from `react-native-web`.
 *
 * M2 of `plans/pure-react-dom-backend.md` moved everything else to the DOM
 * backend in `primitives/dom`; M3 ports these six and the list goes to zero.
 */
const DELEGATED_TO_REACT_NATIVE_WEB = [
  "Animated",
  "Easing",
  "FlatList",
  "PanResponder",
  "ScrollView",
  "TextInput",
];

/** The names the web seam takes from its own DOM backend. */
const SERVED_BY_THE_DOM_BACKEND = [
  "AccessibilityInfo",
  "Image",
  "InputAccessoryView",
  "Keyboard",
  "KeyboardAvoidingView",
  "Modal",
  "Platform",
  "Pressable",
  "StyleSheet",
  "Text",
  "View",
  "useWindowDimensions",
];

/** Names bound by one `import { ... } from "<module>"` statement. */
function importedNames(source: string, from: string): string[] {
  const block = new RegExp(`import \\{([^}]*)\\} from "${from}"`).exec(source);
  if (!block) return [];
  return block[1]
    .split(",")
    .map((entry) =>
      entry
        .trim()
        .split(/\s+as\s+/)[0]
        .trim(),
    )
    .filter(Boolean)
    .sort();
}

test("web primitives delegate to web packages and native ones to native packages", () => {
  const web = readFileSync(
    new URL("reactNative.web.ts", primitivesRoot),
    "utf8",
  );
  // The web seam owns its type surface (`./types`) rather than borrowing React
  // Native's, so `dist/node`'s declarations never name the package.
  assert.match(web, /from "\.\/types"/);
  assert.doesNotMatch(web, /from "react-native"/);
  assert.doesNotMatch(web, /import\("react-native"\)/);

  assert.deepEqual(
    importedNames(web, "react-native-web"),
    DELEGATED_TO_REACT_NATIVE_WEB,
    "only the not-yet-ported primitives come from react-native-web",
  );
  assert.deepEqual(
    importedNames(web, "\\./dom"),
    SERVED_BY_THE_DOM_BACKEND,
    "every ported primitive comes from the library's own DOM backend",
  );

  const shim = readFileSync(
    new URL("react-native-web.d.ts", primitivesRoot),
    "utf8",
  );
  assert.doesNotMatch(shim, /"react-native"/);
  for (const name of DELEGATED_TO_REACT_NATIVE_WEB) {
    assert.match(
      shim,
      new RegExp(`export const ${name}:`),
      `react-native-web.d.ts declares ${name}`,
    );
  }
  for (const name of SERVED_BY_THE_DOM_BACKEND) {
    assert.doesNotMatch(
      shim,
      new RegExp(`export const ${name}:`),
      `react-native-web.d.ts no longer declares ${name}`,
    );
  }

  // The DOM backend is the only thing under `dom/` that may reach for
  // `react-native-web`, and only for the responder system PanResponder needs.
  const domImporters = readdirSync(new URL("dom/", primitivesRoot))
    .filter((file) =>
      /from "react-native-web/.test(
        readFileSync(new URL(`dom/${file}`, primitivesRoot), "utf8"),
      ),
    )
    .sort();
  assert.deepEqual(domImporters, ["responderEvents.ts"]);

  for (const file of readdirSync(new URL("types/", primitivesRoot))) {
    const source = readFileSync(
      new URL(`types/${file}`, primitivesRoot),
      "utf8",
    );
    assert.doesNotMatch(
      source,
      /from "react-native|import\("react-native/,
      `primitives/types/${file} is vendored, not re-exported`,
    );
  }

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
    readFileSync(new URL("svg.tsx", primitivesRoot), "utf8"),
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
