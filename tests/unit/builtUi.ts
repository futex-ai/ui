/**
 * Loads the built package for the static-markup tests. They run against `dist`
 * rather than `src` because the web build resolves the DOM backend there, and
 * only under `npm run test:dist`, after `npm run build`.
 */
import { existsSync } from "node:fs";

const distEntry = new URL("../../dist/node/index.js", import.meta.url);
const primitivesEntry = new URL(
  "../../dist/node/primitives/index.js",
  import.meta.url,
);

/** Whether this run should exercise the built package. */
export const testBuilt =
  process.env.FIRNA_TEST_DIST === "1" && existsSync(distEntry);

/** The built package's root module. */
export async function loadBuiltUi() {
  return import(distEntry.href);
}

/** The built package's primitives module. */
export async function loadBuiltPrimitives(): Promise<
  typeof import("../../src/primitives")
> {
  return import(primitivesEntry.href);
}
