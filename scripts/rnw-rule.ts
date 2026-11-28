import { rnwForms } from "../src/primitives/rnwForms.js";

const nativeForms = new Set(
  Object.entries(rnwForms).flatMap(([seam, form]) =>
    form === "native" ? [seam] : [],
  ),
);

export function resolveFirnaRnwFileInDist(
  distRoot: string,
  fromFile: string,
  request: string,
): string | null {
  if (!/^\.\.?\//.test(request) || request.includes("\\")) {
    return null;
  }

  const fileStart = request.lastIndexOf("/") + 1;
  const seam = request.slice(fileStart).replace(/(?:\.web)?\.js$|\.web$/, "");
  if (!nativeForms.has(seam)) {
    return null;
  }

  const dist = normalizeAbsolutePath(distRoot);
  const importer = normalizeAbsolutePath(fromFile);
  if (dist === null || importer === null || !importer.startsWith(`${dist}/`)) {
    return null;
  }

  const importerDir = importer.slice(0, importer.lastIndexOf("/") + 1);
  const targetDir = normalizeAbsolutePath(
    importerDir + request.slice(0, fileStart),
  );
  if (
    targetDir !== `${dist}/primitives` &&
    targetDir !== `${dist}/node/primitives`
  ) {
    return null;
  }

  const file = `${dist}/primitives/${seam}.js`;
  return distRoot.includes("\\") ? file.replaceAll("/", "\\") : file;
}

function normalizeAbsolutePath(path: string): string | null {
  const slashed = path.replaceAll("\\", "/");
  const root = /^(?:[a-z]:\/|\/\/[^/]+\/[^/]+\/|\/)/i.exec(slashed)?.[0];
  if (root === undefined) {
    return null;
  }

  const parts: string[] = [];
  for (const part of slashed.slice(root.length).split("/")) {
    if (part === "..") {
      parts.pop();
    } else if (part !== "" && part !== ".") {
      parts.push(part);
    }
  }
  return root + parts.join("/");
}
