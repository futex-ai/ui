import { resolveFirnaRnwFileInDist } from "./rnw-rule.js";

type IconLists = {
  readonly web: readonly string[];
  readonly native: readonly string[];
};
type IconNames = Readonly<Record<string, IconLists>>;

declare const FIRNA_ICON_NAMES: IconNames;

export const firnaIconNames: IconNames = Object.freeze(FIRNA_ICON_NAMES);
for (const lists of Object.values(firnaIconNames)) {
  Object.freeze(lists.web);
  Object.freeze(lists.native);
  Object.freeze(lists);
}

export function resolveFirnaRnwFile(
  fromFile: string,
  request: string,
): string | null {
  return resolveFirnaRnwFileInDist(__dirname, fromFile, request);
}
