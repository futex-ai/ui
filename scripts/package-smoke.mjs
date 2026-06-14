import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

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
  const consumerRoot = join(smokeRoot, "consumer");
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

  await linkPeerDependencies(
    consumerRoot,
    Object.keys(packageJson.peerDependencies),
  );
  await writeImportSmoke(consumerRoot, subpaths);
  await writeViteConfig(consumerRoot);
  await execFileAsync(
    "node",
    [resolve(workspaceRoot, "node_modules", "vite", "bin", "vite.js"), "build"],
    { cwd: consumerRoot },
  );
} finally {
  await rm(smokeRoot, { force: true, recursive: true });
}

async function linkPeerDependencies(consumerRoot, peerNames) {
  for (const peerName of peerNames) {
    const sourceName =
      peerName === "react-native" ? "react-native-web" : peerName;
    const source = join(workspaceRoot, "node_modules", sourceName);
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

async function writeViteConfig(consumerRoot) {
  const body = `export default {
  build: {
    rollupOptions: {
      external: [
        /^lucide-react-native(\\/.*)?$/,
        /^react(\\/.*)?$/,
        /^react-dom(\\/.*)?$/,
        /^react-native(\\/.*)?$/,
        /^react-native-svg(\\/.*)?$/,
        /^react-native-web(\\/.*)?$/,
      ],
      input: "import-smoke.mjs",
    },
  },
};
`;
  await writeFile(join(consumerRoot, "vite.config.mjs"), body);
}
