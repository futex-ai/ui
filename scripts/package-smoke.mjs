import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  writeNodePeerStubs,
  writeTypePeerStubs,
} from "./package-smoke-stubs.mjs";

const execFileAsync = promisify(execFile);
const workspaceRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packageJson = JSON.parse(
  await readFile(join(workspaceRoot, "package.json"), "utf8"),
);
const packageName = "@firna/ui";
const subpaths = Object.keys(packageJson.exports).map((key) =>
  key === "." ? packageName : `${packageName}${key.slice(1)}`,
);

assert.equal(packageJson.name, packageName);
/**
 * The complete web peer set. A web consumer installs these three and nothing
 * else: the platform seam's `.web` files render through the library's own DOM
 * backend, so `react-native`, `react-native-web`, `react-native-svg` and
 * `lucide-react-native` are never resolved by `dist/node`.
 */
const WEB_PEER_DEPENDENCIES = ["lucide-react", "react", "react-dom"];
for (const peerName of WEB_PEER_DEPENDENCIES) {
  assert.ok(
    peerName in packageJson.peerDependencies,
    `${peerName} is a declared peer dependency`,
  );
}

const smokeRoot = await mkdtemp(join(tmpdir(), "firna-ui-package-"));

try {
  const { stdout } = await execFileAsync(
    "npm",
    ["pack", "--json", "--pack-destination", smokeRoot],
    { cwd: workspaceRoot },
  );
  const [packResult] = JSON.parse(stdout);
  assert.equal(packResult.name, packageName);
  assertPackedFiles(packResult.files);

  const tarballPath = join(smokeRoot, basename(packResult.filename));
  const nodeConsumerRoot = join(smokeRoot, "node-consumer");
  await prepareConsumer(nodeConsumerRoot, tarballPath);
  await writeNodePeerStubs(nodeConsumerRoot);
  await writeImportSmoke(nodeConsumerRoot, subpaths);
  await runNodeSmoke(nodeConsumerRoot);

  const typesConsumerRoot = join(smokeRoot, "types-consumer");
  await prepareConsumer(typesConsumerRoot, tarballPath);
  await writeTypePeerStubs(typesConsumerRoot);
  await writeTypeSmoke(typesConsumerRoot, subpaths);
  await writeTypeScriptConfig(typesConsumerRoot);
  await execFileAsync(
    "node",
    [resolve(workspaceRoot, "node_modules", "typescript", "bin", "tsc")],
    { cwd: typesConsumerRoot },
  );

  const viteConsumerRoot = join(smokeRoot, "vite-consumer");
  await prepareConsumer(viteConsumerRoot, tarballPath);
  // Only the web peer set is linked, and only those three are externalised, so
  // the library itself is bundled into the consumer's own chunk. Every module
  // `dist/node` reaches has to resolve from those three alone: an import of
  // `react-native`, `react-native-web`, `react-native-svg` or
  // `lucide-react-native` anywhere in the tree fails the Rollup resolve.
  await linkPeerDependencies(viteConsumerRoot, WEB_PEER_DEPENDENCIES);
  await writeImportSmoke(viteConsumerRoot, subpaths);
  await writeViteConfig(viteConsumerRoot);
  await execFileAsync(
    "node",
    [resolve(workspaceRoot, "node_modules", "vite", "bin", "vite.js"), "build"],
    { cwd: viteConsumerRoot },
  );
  await assertViteBundledLibrary(viteConsumerRoot);
} finally {
  await rm(smokeRoot, { force: true, recursive: true });
}

/**
 * Runs the packed package's import smoke test, surfacing the real error.
 * Node floods stderr with `DEP0151` warnings for every stubbed peer, so a raw
 * failure reads only as "Command failed"; the noise is filtered out here so a
 * missing export is legible at a glance.
 */
async function runNodeSmoke(consumerRoot) {
  try {
    await execFileAsync("node", ["import-smoke.mjs"], { cwd: consumerRoot });
  } catch (error) {
    const detail = String(error.stderr ?? "")
      .split("\n")
      .filter(
        (line) =>
          line.trim() !== "" &&
          !/DeprecationWarning|Default "index" lookups|trace-deprecation/.test(
            line,
          ),
      )
      .join("\n");
    if (detail) {
      console.error(`Import smoke failed:\n${detail}`);
    }
    throw error;
  }
}

async function prepareConsumer(consumerRoot, tarballPath) {
  await mkdir(consumerRoot);
  await writeFile(
    join(consumerRoot, "package.json"),
    JSON.stringify({ name: "firna-ui-smoke", type: "module", private: true }),
  );
  await execFileAsync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--legacy-peer-deps",
      tarballPath,
    ],
    { cwd: consumerRoot },
  );
}

async function linkPeerDependencies(consumerRoot, peerNames) {
  for (const peerName of peerNames) {
    const source = join(workspaceRoot, "node_modules", peerName);
    const target = join(consumerRoot, "node_modules", peerName);
    await mkdir(resolve(target, ".."), { recursive: true });
    await symlink(source, target, "junction");
  }
}

function assertPackedFiles(files) {
  for (const file of files) {
    const allowedRoot =
      file.path === "README.md" ||
      file.path === "package.json" ||
      file.path.startsWith("dist/");
    assert.ok(allowedRoot, `unexpected packed file: ${file.path}`);
    assert.ok(
      !file.path.startsWith("dist/stories/"),
      `storybook artifact packed: ${file.path}`,
    );
  }
}

/**
 * Asserts the Vite consumer bundled the library rather than externalising it.
 *
 * `external` names only the three web peers, so `@firna/ui` is pulled into the
 * consumer's own chunk and every module it reaches has to resolve. Without this
 * check a stray `external` entry (or a future Vite default) could let the build
 * pass while the library was never loaded at all.
 */
async function assertViteBundledLibrary(consumerRoot) {
  const outDir = join(consumerRoot, "dist");
  const chunks = await Promise.all(
    (await readdir(outDir, { recursive: true, withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
      .map((entry) => readFile(join(entry.parentPath, entry.name), "utf8")),
  );
  assert.ok(chunks.length > 0, "the Vite consumer emitted a JavaScript chunk");
  const bundle = chunks.join("\n");
  // A string literal only the DOM backend defines (`dom/css.ts`), so its
  // presence means the library's own modules were bundled and not left behind
  // an import of `@firna/ui`.
  assert.match(
    bundle,
    /firna-ui-dom-backend/,
    "the bundle contains the library's DOM backend",
  );
  assert.doesNotMatch(
    bundle,
    /(from|import|require\()\s*["']@firna\/ui/,
    "the library is bundled, not left as an external import",
  );
}

async function writeImportSmoke(consumerRoot, importNames) {
  const lines = importNames.map(
    (name, index) => `import * as mod${index} from ${JSON.stringify(name)};
void mod${index};`,
  );
  const body = `${lines.join("\n")}
console.log("package imports resolved");
`;
  await writeFile(join(consumerRoot, "import-smoke.mjs"), body);
}

async function writeTypeSmoke(consumerRoot, importNames) {
  const lines = importNames.map(
    (name, index) => `import type * as mod${index} from ${JSON.stringify(name)};
type Module${index} = typeof mod${index};`,
  );
  const body = `${lines.join("\n")}
export {};
`;
  await writeFile(join(consumerRoot, "import-smoke.ts"), body);
}

async function writeTypeScriptConfig(consumerRoot) {
  const body = {
    compilerOptions: {
      module: "NodeNext",
      moduleResolution: "NodeNext",
      noEmit: true,
      skipLibCheck: false,
      strict: true,
      target: "ES2023",
    },
    include: ["import-smoke.ts"],
  };
  await writeFile(join(consumerRoot, "tsconfig.json"), JSON.stringify(body));
}

async function writeViteConfig(consumerRoot) {
  const body = `export default {
  build: {
    rollupOptions: {
      external: [
        /^lucide-react(\\/.*)?$/,
        /^react(\\/.*)?$/,
        /^react-dom(\\/.*)?$/,
      ],
      input: "import-smoke.mjs",
    },
  },
};
`;
  await writeFile(join(consumerRoot, "vite.config.mjs"), body);
}
