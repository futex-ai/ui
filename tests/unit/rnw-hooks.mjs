import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveFirnaRnwFile } from "@firna/ui/rnw";

export async function resolve(specifier, context, nextResolve) {
  const file = context.parentURL?.startsWith("file:")
    ? resolveFirnaRnwFile(fileURLToPath(context.parentURL), specifier)
    : null;
  return file
    ? { url: pathToFileURL(file).href, shortCircuit: true }
    : nextResolve(
        specifier === "react-native" ? "react-native-web" : specifier,
        context,
      );
}
