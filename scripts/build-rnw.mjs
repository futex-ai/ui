import { readFileSync, statSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import ts from "typescript";

import packageJson from "../package.json" with { type: "json" };
import { generateFirnaIconNames } from "./rnw-icons.ts";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const entry = fileURLToPath(new URL("./rnw-entry.ts", import.meta.url));
const dist = new URL("../dist/", import.meta.url);
const iconNames = generateFirnaIconNames(packageRoot, packageJson, (file) =>
  statSync(file, { throwIfNoEntry: false })?.isFile()
    ? readFileSync(file, "utf8")
    : undefined,
);
const iconSpecifiers = Object.keys(iconNames)
  .map((specifier) => JSON.stringify(specifier))
  .join(" | ");
const source = `${await readFile(entry, "utf8")}
export const firnaIconNames: IconNames<${iconSpecifiers}> = freezeIconNames(${JSON.stringify(iconNames)});
`;

const { outputText, diagnostics } = ts.transpileDeclaration(source, {
  fileName: entry,
  reportDiagnostics: true,
});
if (diagnostics?.length) {
  const messages = diagnostics.map(({ messageText }) =>
    ts.flattenDiagnosticMessageText(messageText, "\n"),
  );
  throw new Error(`Could not emit RNW declarations:\n${messages.join("\n")}`);
}

await build({
  stdin: {
    contents: source,
    loader: "ts",
    resolveDir: dirname(entry),
    sourcefile: entry,
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "es2022",
  outfile: fileURLToPath(new URL("rnw.cjs", dist)),
});
await writeFile(new URL("rnw.d.cts", dist), outputText);
