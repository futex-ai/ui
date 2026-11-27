import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { readWebLucideNames } from "./rnw-icons.ts";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
export const ICON_NAMES = readWebLucideNames(packageRoot, (file) =>
  readFileSync(file, "utf8"),
);
