import { dirname, join, resolve } from "node:path";

import ts from "typescript";

type ReadModule = (file: string) => string | undefined;
type PackageManifest = {
  readonly name: string;
  readonly exports: Readonly<
    Record<
      string,
      | { readonly import: string; readonly "react-native": string }
      | { readonly default: string }
    >
  >;
};
type NativePlatform = "ios" | "android";
type ModuleReference = {
  request: string;
  names: string[];
  all?: boolean;
};
type ParsedModule = {
  references: ModuleReference[];
  iconSeam?: IconSeam;
};
type IconSeam = {
  exports: Set<string>;
  lucideNames: string[];
};

const webIconSeam = "dist/node/primitives/icons.web.js";
const nativeIconSeam = "dist/primitives/icons";
const webLucidePackage = "lucide-react";

export function generateFirnaIconNames(
  packageRoot: string,
  manifest: PackageManifest,
  readModule: ReadModule,
): Record<string, { web: string[]; native: string[] }> {
  const webSeam = resolve(packageRoot, webIconSeam);
  const nativeSeam = resolve(packageRoot, nativeIconSeam);
  const seamPackages = new Map([[webSeam, webLucidePackage]]);
  for (const platform of ["ios", "android"] as const) {
    for (const file of nativeModuleFiles(nativeSeam, platform)) {
      seamPackages.set(file, "lucide-react-native");
    }
  }
  const modules = new Map<string, ParsedModule | undefined>();

  return Object.fromEntries(
    Object.entries(manifest.exports).map(([key, entry]) => {
      const specifier = manifest.name + key.slice(1);
      if (key === "./rnw") {
        return [specifier, { web: [], native: [] }];
      }
      if (!("import" in entry)) {
        throw new Error(`Missing build tree entries for ${specifier}`);
      }

      const web = new Set<string>();
      const native = new Set<string>();
      const nativeEntry = resolve(packageRoot, entry["react-native"]);
      collect(resolve(packageRoot, entry.import), web);
      collect(nativeEntry, native, "ios");
      collect(nativeEntry, native, "android");
      return [specifier, { web: [...web].sort(), native: [...native].sort() }];
    }),
  );

  function load(file: string): ParsedModule | undefined {
    if (!modules.has(file)) {
      const source = readModule(file);
      modules.set(
        file,
        source === undefined
          ? undefined
          : parseModule(file, source, seamPackages.get(file)),
      );
    }
    return modules.get(file);
  }

  function collect(
    entry: string,
    icons: Set<string>,
    platform?: NativePlatform,
  ): void {
    const seen = new Set<string>();
    if (!load(entry)) {
      throw new Error(
        `Missing ${platform ?? "web"} icon graph entry: ${entry}`,
      );
    }
    visit(entry);

    function visit(file: string): void {
      if (seen.has(file)) return;
      seen.add(file);

      for (const reference of load(file)?.references ?? []) {
        const { request } = reference;
        if (!request.startsWith("./") && !request.startsWith("../")) continue;

        const base = resolve(dirname(file), request);
        const candidates = platform
          ? [
              base,
              ...nativeModuleFiles(base, platform),
              ...nativeModuleFiles(join(base, "index"), platform),
            ]
          : [base];
        const dependency = candidates.find((candidate) => load(candidate));
        if (dependency === undefined) {
          throw new Error(
            `Cannot resolve ${JSON.stringify(request)} from ${file}`,
          );
        }

        const seam = load(dependency)?.iconSeam?.exports;
        if (seam === undefined) {
          visit(dependency);
        } else {
          for (const name of reference.names) {
            if (!seam.has(name)) {
              throw new Error(
                `Icon ${JSON.stringify(name)} imported by ${file} is not exported by ${dependency}`,
              );
            }
            icons.add(name);
          }
          if (reference.all) {
            for (const name of seam) icons.add(name);
          }
        }
      }
    }
  }
}

export function readWebLucideNames(
  packageRoot: string,
  readModule: ReadModule,
): readonly string[] {
  const file = resolve(packageRoot, webIconSeam);
  const source = readModule(file);
  if (source === undefined) throw new Error(`Missing web icon seam: ${file}`);
  const module = parseJavaScript(file, source);
  return readIconSeam(module, referencesOf(module), webLucidePackage)
    .lucideNames;
}

function nativeModuleFiles(base: string, platform: NativePlatform): string[] {
  return [`${base}.${platform}.js`, `${base}.native.js`, `${base}.js`];
}

function parseModule(
  file: string,
  source: string,
  lucidePackage?: string,
): ParsedModule {
  const module = parseJavaScript(file, source);
  const references = referencesOf(module);
  if (lucidePackage === undefined) return { references };
  return {
    references,
    iconSeam: readIconSeam(module, references, lucidePackage),
  };
}

function readIconSeam(
  module: ts.SourceFile,
  references: ModuleReference[],
  lucidePackage: string,
): IconSeam {
  const exports = new Set<string>();
  for (const statement of module.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const { name } of statement.exportClause.elements) {
        exports.add(name.text);
      }
    }
  }

  const names = new Set<string>();
  for (const reference of references) {
    if (reference.request !== lucidePackage) continue;
    if (reference.all) {
      throw new Error(
        `${module.fileName} must name its imports from ${lucidePackage}`,
      );
    }
    for (const name of reference.names) names.add(name);
  }
  return { exports, lucideNames: [...names].sort() };
}

function parseJavaScript(file: string, source: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.ESNext,
    false,
    ts.ScriptKind.JS,
  );
}

function referencesOf(source: ts.SourceFile): ModuleReference[] {
  const references: ModuleReference[] = [];
  ts.forEachChild(source, visit);
  return references;

  function visit(node: ts.Node): void {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      const bindings = node.importClause?.namedBindings;
      const names = node.importClause?.name ? ["default"] : [];
      if (bindings && ts.isNamedImports(bindings)) {
        names.push(...bindings.elements.map(importedName));
      }
      references.push({
        request: node.moduleSpecifier.text,
        names,
        all: bindings !== undefined && ts.isNamespaceImport(bindings),
      });
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      const clause = node.exportClause;
      const named = clause && ts.isNamedExports(clause);
      references.push({
        request: node.moduleSpecifier.text,
        names: named ? clause.elements.map(importedName) : [],
        all: !named,
      });
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const request = node.arguments[0];
      if (request && ts.isStringLiteralLike(request)) {
        references.push({ request: request.text, names: [], all: true });
      }
    }
    ts.forEachChild(node, visit);
  }
}

function importedName(
  specifier: ts.ImportSpecifier | ts.ExportSpecifier,
): string {
  return (specifier.propertyName ?? specifier.name).text;
}
