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
  await execFileAsync("node", ["import-smoke.mjs"], { cwd: nodeConsumerRoot });

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
  await linkPeerDependencies(
    viteConsumerRoot,
    Object.keys(packageJson.peerDependencies),
  );
  await writeImportSmoke(viteConsumerRoot, subpaths);
  await writeViteConfig(viteConsumerRoot);
  await execFileAsync(
    "node",
    [resolve(workspaceRoot, "node_modules", "vite", "bin", "vite.js"), "build"],
    { cwd: viteConsumerRoot },
  );
} finally {
  await rm(smokeRoot, { force: true, recursive: true });
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
