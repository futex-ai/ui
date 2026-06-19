import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readSource("../../package.json"));

test("package metadata targets the public Firna npm package", () => {
  assert.equal(packageJson.name, "@firna/ui");
  assert.equal(packageJson.private, false);
  assert.equal(packageJson.main, "./dist/node/index.js");
  assert.equal(packageJson.types, "./dist/node/index.d.ts");
  assert.equal(packageJson["react-native"], "./dist/index.js");
  assert.deepEqual(packageJson.publishConfig, {
    access: "public",
    registry: "https://registry.npmjs.org/",
    provenance: true,
  });
});

test("package exposes every documented public subpath", () => {
  assert.deepEqual(Object.keys(packageJson.exports), [
    ".",
    "./avatar",
    "./button",
    "./calendar",
    "./date",
    "./drag-select",
    "./dropdown",
    "./heatmap",
    "./input",
    "./list",
    "./modal",
    "./popover",
    "./radio",
    "./segmented",
    "./skeleton",
    "./spinner",
    "./switch",
    "./table",
    "./theme",
    "./toast",
    "./typography",
  ]);

  for (const [subpath, exportConfig] of Object.entries(packageJson.exports)) {
    assertExportConfig(subpath, exportConfig);
  }
});

function assertExportConfig(subpath: string, exportConfig: unknown) {
  assert.ok(exportConfig && typeof exportConfig === "object");
  const config = exportConfig as Record<string, string>;
  assert.ok(
    config.types.startsWith("./dist/node/"),
    `${subpath} uses Node-compatible declarations`,
  );
  assert.ok(config.types.endsWith(".d.ts"), `${subpath} has types`);
  assert.ok(
    config["react-native"].startsWith("./dist/"),
    `${subpath} keeps React Native dist export`,
  );
  assert.ok(
    !config["react-native"].startsWith("./dist/node/"),
    `${subpath} keeps platform resolution for React Native`,
  );
  assert.ok(
    config.import.startsWith("./dist/node/"),
    `${subpath} imports Node-compatible dist`,
  );
  assert.ok(config.import.endsWith(".js"), `${subpath} imports JS`);
}

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
