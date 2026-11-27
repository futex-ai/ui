import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import ts from "typescript";

import packageJson from "../../package.json" with { type: "json" };
import { firnaRnwPlugin, reactNativeWebAlias } from "../../scripts/rnw-esbuild";
import type { generateFirnaIconNames } from "../../scripts/rnw-icons";
import { rnwForms } from "../../src/primitives/rnwForms";

const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));
const dist = join(workspaceRoot, "dist");
const publicSpecifiers = Object.keys(packageJson.exports).map(
  (key) => `${packageJson.name}${key.slice(1)}`,
);
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
  assert.deepEqual(
    Object.keys(firnaIconNames ?? {}).sort(),
    [...publicSpecifiers].sort(),
  );
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

test("RNW bundles of every public subpath exclude the DOM backend and native SVG and icon packages", async () => {
  const trees = [
    {
      name: "node",
      entryPoints: publicSpecifiers,
    },
    {
      // Model Metro web resolution when it selects the native build tree.
      name: "native",
      entryPoints: Object.values(packageJson.exports).map((entry) =>
        "react-native" in entry ? entry["react-native"] : entry.default,
      ),
      resolveExtensions: [".web.js", ".js", ".json"],
    },
  ];
  const firnaRnw = firnaRnwPlugin();

  const forbiddenInputs = await Promise.all(
    trees.map(async ({ name, ...resolution }) => {
      const { metafile } = await build({
        absWorkingDir: workspaceRoot,
        ...resolution,
        outdir: ".context/rnw-bundles",
        bundle: true,
        write: false,
        metafile: true,
        format: "esm",
        alias: reactNativeWebAlias,
        plugins: [firnaRnw],
      });
      return Object.keys(metafile.inputs)
        .map((path) => path.replaceAll("\\", "/"))
        .filter((path) =>
          /(?:^|\/)(?:primitives\/dom|node_modules\/(?:react-native-svg|lucide-react-native))\//.test(
            path,
          ),
        )
        .sort()
        .map((path) => `${name}: ${path}`);
    }),
  );
  assert.deepEqual(
    forbiddenInputs.flat(),
    [],
    "DOM backend, native SVG, or native icon files in the RNW bundles",
  );
});

test("Node imports every public subpath with the RNW hook", () => {
  const source = `
    for (const specifier of process.argv.slice(1)) {
      await import(specifier).catch((cause) => {
        throw new Error("Could not import " + specifier, { cause });
      });
    }
  `;
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "./tests/unit/rnw-register.mjs",
      "--input-type=module",
      "--eval",
      source,
      "--",
      ...publicSpecifiers,
    ],
    { cwd: workspaceRoot, encoding: "utf8" },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr || result.signal || undefined);
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
