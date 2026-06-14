import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readSource("../../package.json"));

test("package metadata targets the public Firna npm package", () => {
  assert.equal(packageJson.name, "@firna/ui");
  assert.equal(packageJson.private, false);
  assert.deepEqual(packageJson.publishConfig, {
    access: "public",
    registry: "https://registry.npmjs.org/",
    provenance: true,
  });
});

test("package exposes every documented public subpath", () => {
  assert.deepEqual(Object.keys(packageJson.exports), [
    ".",
    "./date",
    "./dropdown",
    "./input",
    "./modal",
    "./popover",
    "./radio",
    "./segmented",
    "./switch",
    "./theme",
  ]);

  for (const [subpath, exportConfig] of Object.entries(packageJson.exports)) {
    assertExportConfig(subpath, exportConfig);
  }
});

function assertExportConfig(subpath: string, exportConfig: unknown) {
  assert.ok(exportConfig && typeof exportConfig === "object");
  const config = exportConfig as Record<string, string>;
  assert.ok(config.types.endsWith(".d.ts"), `${subpath} has types`);
  assert.equal(config["react-native"], config.import);
  assert.ok(config.import.startsWith("./dist/"), `${subpath} imports dist`);
  assert.ok(config.import.endsWith(".js"), `${subpath} imports JS`);
}

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
