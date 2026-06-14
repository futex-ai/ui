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
  const nodeConsumerRoot = join(smokeRoot, "node-consumer");
  await prepareConsumer(nodeConsumerRoot, tarballPath);
  await writeNodePeerStubs(nodeConsumerRoot);
  await writeImportSmoke(nodeConsumerRoot, subpaths);
  await execFileAsync("node", ["import-smoke.mjs"], { cwd: nodeConsumerRoot });

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

async function writeNodePeerStubs(consumerRoot) {
  await writeStubPackage(consumerRoot, "react", {
    "index.js": `export const Fragment = Symbol.for("react.fragment");
export function createContext(defaultValue) {
  return { Provider: ({ children }) => children, _currentValue: defaultValue };
}
export function useCallback(callback) {
  return callback;
}
export function useContext(context) {
  return context?._currentValue;
}
export function useEffect() {}
export function useLayoutEffect() {}
export function useMemo(factory) {
  return factory();
}
export function useRef(value = null) {
  return { current: value };
}
export function useState(value) {
  return [typeof value === "function" ? value() : value, () => {}];
}
export default {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
};
`,
    "jsx-runtime.js": `export const Fragment = Symbol.for("react.fragment");
export function jsx(type, props) {
  return { type, props };
}
export const jsxs = jsx;
`,
    "package.json": JSON.stringify({
      name: "react",
      type: "module",
      exports: {
        ".": "./index.js",
        "./jsx-runtime": "./jsx-runtime.js",
      },
    }),
  });
  await writeStubPackage(consumerRoot, "react-dom", {
    "index.js": `export function createPortal(children) {
  return children;
}
`,
    "package.json": JSON.stringify({ name: "react-dom", type: "module" }),
  });
  await writeStubPackage(consumerRoot, "react-native", {
    "index.js": `export const Modal = "Modal";
export const Pressable = "Pressable";
export const ScrollView = "ScrollView";
export const Text = "Text";
export const TextInput = "TextInput";
export const View = "View";
export const Platform = {
  OS: "web",
  select(values) {
    return values.web ?? values.default;
  },
};
export const StyleSheet = {
  absoluteFillObject: {},
  create(styles) {
    return styles;
  },
  flatten(styles) {
    return styles;
  },
};
export function useWindowDimensions() {
  return { fontScale: 1, height: 768, scale: 1, width: 1024 };
}
`,
    "package.json": JSON.stringify({ name: "react-native", type: "module" }),
  });
  await writeStubPackage(consumerRoot, "react-native-svg", {
    "index.js": `export default "Svg";
`,
    "package.json": JSON.stringify({
      name: "react-native-svg",
      type: "module",
    }),
  });
  await writeStubPackage(consumerRoot, "lucide-react-native", {
    "index.js": `const Icon = () => null;
export const CalendarDays = Icon;
export const Check = Icon;
export const ChevronDown = Icon;
export const ChevronLeft = Icon;
export const ChevronRight = Icon;
export const CircleX = Icon;
export const Search = Icon;
export const X = Icon;
`,
    "package.json": JSON.stringify({
      name: "lucide-react-native",
      type: "module",
    }),
  });
}

async function writeStubPackage(consumerRoot, packageName, files) {
  const packageRoot = join(consumerRoot, "node_modules", packageName);
  await mkdir(packageRoot, { recursive: true });
  await Promise.all(
    Object.entries(files).map(([fileName, body]) =>
      writeFile(join(packageRoot, fileName), body),
    ),
  );
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
