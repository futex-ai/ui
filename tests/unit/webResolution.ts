/**
 * Loads source modules as the web build resolves them, for the unit tests of a
 * `.web` host that imports another seam module.
 *
 * The unit tests run through `tsx`, which resolves a seam request such as
 * `./reactNative` to the native file. The web build resolves it to the `.web`
 * sibling: `tsconfig.web.json` tries the `.web` suffix first, and
 * `scripts/prepare-node-esm.mjs` names the `.web.js` file. After
 * `resolveWebFirst()`, a relative import from a file under `src/` loads the
 * `.web` sibling when one exists. A module that loaded before the call keeps
 * its resolution, so a test calls it first and then imports the host with a
 * dynamic `import()`.
 */
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";

const srcRoot = new URL("../../src/", import.meta.url).href;

const WEB_EXTENSIONS = [".web.ts", ".web.tsx"];

/** Makes each later relative import from `src/` prefer the `.web` sibling. */
export function resolveWebFirst(): void {
  registerHooks({
    resolve(specifier, context, nextResolve) {
      const parent = context.parentURL;
      if (specifier.startsWith(".") && parent?.startsWith(srcRoot)) {
        for (const extension of WEB_EXTENSIONS) {
          const webFile = new URL(`${specifier}${extension}`, parent);
          if (existsSync(fileURLToPath(webFile))) {
            return nextResolve(webFile.href, context);
          }
        }
      }
      return nextResolve(specifier, context);
    },
  });
}
