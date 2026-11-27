import { createRequire } from "node:module";

import type { Plugin } from "esbuild";

export const reactNativeWebAlias = { "react-native": "react-native-web" };

export function firnaRnwPlugin(): Plugin {
  const { resolveFirnaRnwFile }: typeof import("./rnw-entry.js") =
    createRequire(import.meta.url)("@firna/ui/rnw");

  return {
    name: "firna-rnw",
    setup(build) {
      build.onResolve({ filter: /^\./ }, (args) => {
        const file = resolveFirnaRnwFile(args.importer, args.path);
        return file ? { path: file } : undefined;
      });
    },
  };
}
