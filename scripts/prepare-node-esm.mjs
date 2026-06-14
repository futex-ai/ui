import { statSync } from "node:fs";
import {
  cp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distRoot = join(workspaceRoot, "dist");
const nodeRoot = join(distRoot, "node");
const tempRoot = join(workspaceRoot, ".dist-node");

await rm(tempRoot, { force: true, recursive: true });
try {
  await rm(nodeRoot, { force: true, recursive: true });
  await cp(distRoot, tempRoot, { recursive: true });
  await rewriteTree(tempRoot);
  await mkdir(dirname(nodeRoot), { recursive: true });
  await rename(tempRoot, nodeRoot);
} catch (error) {
  await rm(tempRoot, { force: true, recursive: true });
  throw error;
}

async function rewriteTree(root) {
  const entries = await readdir(root, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name);
      if (entry.isDirectory()) {
        await rewriteTree(path);
        return;
      }
      if (entry.isFile() && path.endsWith(".js")) {
        await rewriteFile(path);
      }
    }),
  );
}

async function rewriteFile(path) {
  const source = await readFile(path, "utf8");
  const rewritten = source.replace(
    /(from\s+["']|import\s*["']|import\s*\(\s*["'])(\.{1,2}\/[^"']+)(["'])/g,
    (match, prefix, specifier, suffix) =>
      `${prefix}${resolveRelativeSpecifier(path, specifier)}${suffix}`,
  );
  if (rewritten !== source) {
    await writeFile(path, rewritten);
  }
}

function resolveRelativeSpecifier(importer, specifier) {
  if (extname(specifier) !== "") {
    return specifier;
  }

  const base = resolve(dirname(importer), specifier);
  const webFile = `${base}.web.js`;
  const jsFile = `${base}.js`;
  const indexFile = join(base, "index.js");

  if (fileExists(webFile)) {
    return `${specifier}.web.js`;
  }
  if (fileExists(jsFile)) {
    return `${specifier}.js`;
  }
  if (fileExists(indexFile)) {
    return `${specifier}/index.js`;
  }
  return specifier;
}

function fileExists(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
