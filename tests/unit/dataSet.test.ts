import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { dataSetDomProps, dataSetProps } from "../../src/dataSet";

test("dataSetProps spreads nothing when no source carries a dataSet", () => {
  assert.deepEqual(dataSetProps(), {});
  assert.deepEqual(dataSetProps(undefined, {}, { dataSet: undefined }), {});
  // The empty result is shared, so a caller must not be able to mutate it.
  assert.equal(Object.isFrozen(dataSetProps()), true);
});

test("dataSetProps merges every source in order, later keys winning", () => {
  const ring = { dataSet: { firnaFocusRing: "self" } };
  const skip = { dataSet: { firnaInitialFocus: "skip" } };
  const caller = { dataSet: { analytics: "save", firnaFocusRing: "none" } };

  assert.deepEqual(dataSetProps(ring), { dataSet: { firnaFocusRing: "self" } });
  assert.deepEqual(dataSetProps(ring, skip), {
    dataSet: { firnaFocusRing: "self", firnaInitialFocus: "skip" },
  });
  assert.deepEqual(dataSetProps(ring, undefined, skip, caller), {
    dataSet: {
      analytics: "save",
      firnaFocusRing: "none",
      firnaInitialFocus: "skip",
    },
  });
});

test("dataSetDomProps spells a dataSet as literal data-* attributes", () => {
  assert.deepEqual(dataSetDomProps(undefined), {});
  assert.equal(Object.isFrozen(dataSetDomProps(undefined)), true);
  assert.deepEqual(
    dataSetDomProps({
      analyticsId: "save",
      firnaInitialFocus: "skip",
      rowIndex: 3,
      selected: true,
    }),
    {
      "data-analytics-id": "save",
      "data-firna-initial-focus": "skip",
      "data-row-index": 3,
      "data-selected": true,
    },
  );
  // Null and undefined drop out, as the DOM backend drops them.
  assert.deepEqual(dataSetDomProps({ empty: null, gone: undefined, id: "x" }), {
    "data-id": "x",
  });
});

test("dataSetProps copies rather than mutating a source dataSet", () => {
  const frozen = { dataSet: Object.freeze({ firnaInitialFocus: "skip" }) };
  const merged = dataSetProps(frozen, { dataSet: { extra: 1 } });

  assert.deepEqual(merged, {
    dataSet: { extra: 1, firnaInitialFocus: "skip" },
  });
  assert.notEqual(merged.dataSet, frozen.dataSet);
  assert.deepEqual(frozen.dataSet, { firnaInitialFocus: "skip" });
  // A single source is still copied, so a later caller edit cannot leak back.
  assert.notEqual(dataSetProps(frozen).dataSet, frozen.dataSet);
});

/**
 * Public component files: every module a `src/<family>/index.ts` re-exports,
 * plus the `.web` sibling of each, since a platform pair implements one props
 * contract. Pure helpers and style factories are filtered out below by the
 * absence of `testID`.
 */
function publicModuleFiles(): string[] {
  const srcRoot = fileURLToPath(new URL("../../src/", import.meta.url));
  const files = new Set<string>();
  for (const family of readdirSync(srcRoot, { withFileTypes: true })) {
    if (!family.isDirectory() || family.name === "stories") continue;
    const indexPath = join(srcRoot, family.name, "index.ts");
    if (!existsSync(indexPath)) continue;
    const index = readFileSync(indexPath, "utf8");
    for (const match of index.matchAll(/from "\.\/([^"]+)"/g)) {
      for (const suffix of [".tsx", ".web.tsx", ".ts"]) {
        const candidate = join(srcRoot, family.name, `${match[1]}${suffix}`);
        if (existsSync(candidate)) files.add(candidate);
      }
    }
  }
  return [...files].sort();
}

test("every public component that carries a testID also takes and forwards dataSet", () => {
  const missingProp: string[] = [];
  const missingForward: string[] = [];
  for (const file of publicModuleFiles()) {
    const source = readFileSync(file, "utf8");
    const name = relative(process.cwd(), file);
    // A props contract that names `testID` names `dataSet` beside it.
    if (/testID\?: string/.test(source) && !/dataSet\?: DataSet/.test(source)) {
      missingProp.push(name);
    }
    // A host that carries the plain `testID` carries the caller's `dataSet`
    // too, either spread through the merge helper or handed to the child that
    // renders that host. A raw DOM host (`data-testid`) takes the DOM spelling.
    if (
      /testID=\{testID\}/.test(source) &&
      !/dataSetProps\(|dataSet=\{dataSet\}/.test(source)
    ) {
      missingForward.push(name);
    }
    if (
      /data-testid=\{testID\}/.test(source) &&
      !/dataSetDomProps\(dataSet\)/.test(source)
    ) {
      missingForward.push(name);
    }
  }
  assert.deepEqual(missingProp, []);
  assert.deepEqual(missingForward, []);
});
