import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { build, type Plugin } from "esbuild";
import ts from "typescript";

import packageJson from "../../package.json" with { type: "json" };
import type { generateFirnaIconNames } from "../../scripts/rnw-icons";
import { rnwForms } from "../../src/primitives/rnwForms";

const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));
const dist = join(workspaceRoot, "dist");
const {
  firnaIconNames,
  resolveFirnaRnwFile,
}: typeof import("../../scripts/rnw-entry.js") & {
  firnaIconNames: ReturnType<typeof generateFirnaIconNames>;
} = createRequire(import.meta.url)("@firna/ui/rnw");

test("the built RNW rule resolves real requests from both build trees", () => {
  const expectedFile = join(dist, "primitives", "reactNative.js");
  const cases = [
    [join(dist, "node", "list", "List.js"), "../primitives/reactNative.web.js"],
    [join(dist, "list", "List.js"), "../primitives/reactNative"],
  ];
  for (const [importer, request] of cases) {
    assert.ok(importsOf(importer).includes(request), `${importer}: ${request}`);
    assert.equal(resolveFirnaRnwFile(importer, request), expectedFile);
  }
  assert.equal(statSync(expectedFile).isFile(), true);
});

test("native RNW seam files import only packages", () => {
  const nativeForms = Object.entries(rnwForms).filter(
    ([, form]) => form === "native",
  );
  for (const [seam] of nativeForms) {
    const file = join(dist, "primitives", `${seam}.js`);
    const nonPackageImports = importsOf(file).filter((request) =>
      /^(?:[./\\#]|[^/]+:)/.test(request),
    );
    assert.deepEqual(nonPackageImports, [], file);
  }
});

test("the built RNW module lists the icons of every public specifier", () => {
  const specifiers = Object.keys(packageJson.exports).map(
    (key) => `${packageJson.name}${key.slice(1)}`,
  );
  assert.deepEqual(Object.keys(firnaIconNames ?? {}).sort(), specifiers.sort());
  assert.deepEqual(firnaIconNames["@firna/ui/rnw"], { web: [], native: [] });

  const seams = {
    web: join(dist, "node", "primitives", "icons.web.js"),
    native: join(dist, "primitives", "icons.js"),
  };
  for (const platform of ["web", "native"] as const) {
    const seamExports = namedExportsOf(seams[platform]);
    const rootNames = new Set(firnaIconNames[packageJson.name][platform]);
    for (const specifier of ["@firna/ui/link", "@firna/ui/list"]) {
      assert.ok(
        firnaIconNames[specifier][platform].includes("ArrowUpRight"),
        `${specifier} ${platform} must include ArrowUpRight`,
      );
    }
    for (const [specifier, lists] of Object.entries(firnaIconNames)) {
      const names = lists[platform];
      const label = `${specifier} ${platform}`;
      assert.deepEqual(names, [...new Set(names)].sort(), label);
      assert.ok(Object.isFrozen(names), `${label} must be read-only`);
      for (const name of names) {
        assert.ok(seamExports.has(name), `${label}: ${name} is not exported`);
        assert.ok(
          rootNames.has(name),
          `${label}: ${name} is missing from root`,
        );
      }
    }
  }
});

test("RNW bundles of every public subpath exclude the DOM backend", async () => {
  const entries = Object.values(packageJson.exports);
  const trees = [
    {
      name: "node",
      entryPoints: entries.map((entry) =>
        "import" in entry ? entry.import : entry.default,
      ),
      resolveExtensions: undefined,
    },
    {
      name: "native",
      entryPoints: entries.map((entry) =>
        "react-native" in entry ? entry["react-native"] : entry.default,
      ),
      resolveExtensions: [".web.js", ".js", ".json"],
    },
  ];
  const firnaRnw: Plugin = {
    name: "firna-rnw",
    setup(build) {
      build.onResolve({ filter: /^\./ }, ({ importer, path }) => {
        const file = resolveFirnaRnwFile(importer, path);
        return file ? { path: file } : undefined;
      });
    },
  };

  const domInputs = await Promise.all(
    trees.map(async ({ name, entryPoints, resolveExtensions }) => {
      const { metafile } = await build({
        absWorkingDir: workspaceRoot,
        entryPoints,
        outdir: ".context/rnw-bundles",
        bundle: true,
        write: false,
        metafile: true,
        format: "esm",
        packages: "external",
        alias: { "react-native": "react-native-web" },
        resolveExtensions,
        plugins: [firnaRnw],
      });
      return Object.keys(metafile.inputs)
        .map((path) => path.replaceAll("\\", "/"))
        .filter((path) => /(?:^|\/)primitives\/dom\//.test(path))
        .sort()
        .map((path) => `${name}: ${path}`);
    }),
  );
  assert.deepEqual(
    domInputs.flat(),
    [],
    "DOM backend files in the RNW bundles",
  );
});

function importsOf(file: string): string[] {
  const source = readFileSync(file, "utf8");
  return ts
    .preProcessFile(source, true, true)
    .importedFiles.map(({ fileName }) => fileName);
}

function namedExportsOf(file: string): Set<string> {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.ESNext,
  );
  return new Set(
    source.statements.flatMap((statement) => {
      if (
        ts.isExportDeclaration(statement) &&
        statement.exportClause &&
        ts.isNamedExports(statement.exportClause)
      ) {
        return statement.exportClause.elements.map(({ name }) => name.text);
      }
      return [];
    }),
  );
}
