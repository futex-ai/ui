import { resolveFirnaRnwFileInDist } from "./rnw-rule.js";

export function resolveFirnaRnwFile(
  fromFile: string,
  request: string,
): string | null {
  return resolveFirnaRnwFileInDist(__dirname, fromFile, request);
}
