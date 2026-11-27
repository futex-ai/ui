import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import ts from "typescript";

const entry = fileURLToPath(new URL("./rnw-entry.ts", import.meta.url));
const dist = new URL("../dist/", import.meta.url);

const { outputText, diagnostics } = ts.transpileDeclaration(
  await readFile(entry, "utf8"),
  { fileName: entry, reportDiagnostics: true },
);
if (diagnostics?.length) {
  const messages = diagnostics.map(({ messageText }) =>
    ts.flattenDiagnosticMessageText(messageText, "\n"),
  );
  throw new Error(`Could not emit RNW declarations:\n${messages.join("\n")}`);
}

await build({
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "es2022",
  outfile: fileURLToPath(new URL("rnw.cjs", dist)),
});
await writeFile(new URL("rnw.d.cts", dist), outputText);
