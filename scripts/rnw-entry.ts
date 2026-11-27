import { resolveFirnaRnwFileInDist } from "./rnw-rule.js";

type IconLists = {
  readonly web: readonly string[];
  readonly native: readonly string[];
};
type IconNames<Specifier extends string> = {
  readonly [Key in Specifier]: IconLists;
};

function freezeIconNames<Specifier extends string>(
  names: IconNames<Specifier>,
): IconNames<Specifier> {
  Object.freeze(names);
  for (const lists of Object.values<IconLists>(names)) {
    Object.freeze(lists.web);
    Object.freeze(lists.native);
    Object.freeze(lists);
  }
  return names;
}

export function resolveFirnaRnwFile(
  fromFile: string,
  request: string,
): string | null {
  return resolveFirnaRnwFileInDist(__dirname, fromFile, request);
}
