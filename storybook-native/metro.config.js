const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");
const { withStorybook } = require("@storybook/react-native/withStorybook");

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, "..");
const hostModules = path.join(projectRoot, "node_modules");

const config = withStorybook(getDefaultConfig(projectRoot));

// The library is linked via `file:..`; Metro resolves `@firna/ui/*` through the
// package `exports` to the built `dist/` (the `react-native` condition picks the
// native component variants). Watch the repo root so the linked library and its
// transitive deps (in the repo-root node_modules) resolve and hot-reload.
config.watchFolders = [repoRoot];
config.resolver.unstable_enableSymlinks = true;

// Force a SINGLE copy of every shared native/stateful singleton. The linked
// library's dist code is loaded through the symlink, next to the repo-root
// node_modules, so without this Metro pulls a second copy — react/react-native
// crash with "invalid hook", and native-view libraries like react-native-svg
// crash with "Tried to register two views with the same name RNSVGCircle".
// Everything else resolves normally, so transitive deps (semver, etc.) still work.
const singletons = [
  "react",
  "react-native",
  "react-native-svg",
  "react-native-reanimated",
  "react-native-worklets",
  "react-native-gesture-handler",
  "react-native-safe-area-context",
  "@gorhom/bottom-sheet",
  "@react-native-async-storage/async-storage",
  "lucide-react-native",
];
const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isSingleton = singletons.some(
    (name) => moduleName === name || moduleName.startsWith(name + "/"),
  );
  if (isSingleton) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(hostModules, "index.js") },
      moduleName,
      platform,
    );
  }
  return (upstreamResolveRequest ?? context.resolveRequest)(
    context,
    moduleName,
    platform,
  );
};

module.exports = config;
