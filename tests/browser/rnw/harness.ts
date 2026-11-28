import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { Page } from "@playwright/test";
import { build } from "esbuild";

import {
  firnaRnwPlugin,
  reactNativeWebAlias,
} from "../../../scripts/rnw-esbuild";

const workspaceRoot = new URL("../../../", import.meta.url);
const fixtureUrl = "https://firna-rnw.test/";

export async function bundleRnwFixture(
  entryPoint = "fixture.jsx",
  firnaRenderer: "dom" | "rnw" = "rnw",
) {
  if (
    firnaRenderer === "rnw" &&
    !existsSync(new URL("dist/rnw.cjs", workspaceRoot))
  ) {
    throw new Error("dist/rnw.cjs is missing. Run npm run build first.");
  }
  return build({
    absWorkingDir: fileURLToPath(workspaceRoot),
    entryPoints: [`tests/browser/rnw/${entryPoint}`],
    alias: reactNativeWebAlias,
    plugins: firnaRenderer === "rnw" ? [firnaRnwPlugin()] : [],
    format: "iife",
    bundle: true,
    metafile: true,
    minify: true,
    write: false,
  });
}

export async function openRnwFixture(page: Page, script: string) {
  // A context route also catches the first request of a new tab.
  await page
    .context()
    .route(`${fixtureUrl}**`, (route) => route.abort("aborted"));
  await page.route(`${fixtureUrl}fixture.js`, (route) =>
    route.fulfill({ contentType: "application/javascript", body: script }),
  );
  await page.route(fixtureUrl, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html>
<html lang="en">
  <head><title>Firna RNW fixture</title></head>
  <body style="margin: 24px; max-width: 360px;">
    <div id="root"></div>
    <script src="/fixture.js"></script>
  </body>
</html>`,
    }),
  );
  await page.goto(fixtureUrl);
}
