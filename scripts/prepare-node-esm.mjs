/**
 * Builds `dist/node`, the tree every non-`react-native` consumer resolves.
 *
 * `tsc` emits the native tree into `dist` (JS + declarations, resolved against
 * `reactNative.ts`, `svg.tsx`, …) and a second, web-resolution pass emits only
 * declarations into `.dist-web-types` (resolved against the `.web` siblings).
 * This script copies `dist`, overlays the web declarations onto the copy, drops
 * the native modules that a `.web` sibling shadows, rewrites every relative
 * specifier to an explicit, web-first file path, and moves the result into
 * place. Dropping the shadowed modules is what keeps `dist/node/**` free of any
 * `react-native` reference: the native `primitives/reactNative.d.ts` is the one
 * declaration that still names the package, and nothing in the web tree
 * resolves to it.
 */
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
const webTypesRoot = join(workspaceRoot, ".dist-web-types");
const tempRoot = join(workspaceRoot, ".dist-node");

/** Suffixes of the emitted files that belong to one source module. */
const MODULE_SUFFIXES = [".js", ".js.map", ".d.ts", ".d.ts.map"];

await rm(tempRoot, { force: true, recursive: true });
try {
  await rm(nodeRoot, { force: true, recursive: true });
  await cp(distRoot, tempRoot, { recursive: true });
  await overlayWebDeclarations(webTypesRoot, tempRoot);
  await dropShadowedModules(tempRoot);
  await rewriteTree(tempRoot);
  await mkdir(dirname(nodeRoot), { recursive: true });
  await rename(tempRoot, nodeRoot);
} catch (error) {
  await rm(tempRoot, { force: true, recursive: true });
  throw error;
}
await rm(webTypesRoot, { force: true, recursive: true });

/**
 * Replaces the native `.d.ts` / `.d.ts.map` files with the ones the
 * web-resolution pass emitted, so consumers' declarations describe the `.web`
 * modules they actually load.
 */
async function overlayWebDeclarations(source, target) {
  if (!directoryExists(source)) {
    throw new Error(
      `missing ${source}; run \`tsc --project tsconfig.build.web.json\` first`,
    );
  }
  const entries = await readdir(source, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const from = join(source, entry.name);
      const to = join(target, entry.name);
      if (entry.isDirectory()) {
        await mkdir(to, { recursive: true });
        await overlayWebDeclarations(from, to);
        return;
      }
      if (entry.isFile()) {
        await cp(from, to);
      }
    }),
  );
}

/**
 * Removes every module a `.web` sibling shadows. The rewriter below always
 * prefers `foo.web.js` over `foo.js`, so the native file is dead weight in this
 * tree — and it is the only place a `react-native` import could survive.
 */
async function dropShadowedModules(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const shadowed = new Set();
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".web.js")) {
      shadowed.add(entry.name.slice(0, -".web.js".length));
    }
  }
  await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name);
      if (entry.isDirectory()) {
        await dropShadowedModules(path);
        return;
      }
      const suffix = MODULE_SUFFIXES.find((candidate) =>
        entry.name.endsWith(candidate),
      );
      if (suffix === undefined) {
        return;
      }
      const moduleName = entry.name.slice(0, -suffix.length);
      if (!moduleName.endsWith(".web") && shadowed.has(moduleName)) {
        await rm(path);
      }
    }),
  );
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
      if (entry.isFile() && (path.endsWith(".js") || path.endsWith(".d.ts"))) {
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
  if (specifier.endsWith(".web")) {
    const webFile = resolve(dirname(importer), `${specifier}.js`);
    if (fileExists(webFile)) {
      return `${specifier}.js`;
    }
  }

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

function directoryExists(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}
