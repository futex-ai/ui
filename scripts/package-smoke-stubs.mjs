import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Every Lucide glyph the library imports through `src/primitives/icons.ts`.
 * The web build resolves those to `lucide-react`, so the stubbed package must
 * export each name or the import smoke fails on a missing binding.
 */
const ICON_NAMES = [
  "Archive",
  "ArrowDownAZ",
  "ArrowDownToLine",
  "ArrowLeftToLine",
  "ArrowRightToLine",
  "ArrowUpAZ",
  "ArrowUpToLine",
  "Bell",
  "Bold",
  "Brain",
  "Calendar",
  "CalendarDays",
  "Check",
  "ChevronDown",
  "ChevronFirst",
  "ChevronLast",
  "ChevronLeft",
  "ChevronRight",
  "ChevronUp",
  "CircleAlert",
  "CircleCheck",
  "CircleX",
  "ClipboardPaste",
  "Clock",
  "Code",
  "Columns2",
  "Copy",
  "CopyPlus",
  "CornerUpLeft",
  "DollarSign",
  "Download",
  "Eraser",
  "Eye",
  "EyeOff",
  "GitBranch",
  "Grid2x2",
  "GripHorizontal",
  "GripVertical",
  "Hash",
  "Heading1",
  "Heading2",
  "Heading3",
  "Headphones",
  "Image",
  "Inbox",
  "Info",
  "Italic",
  "LayoutGrid",
  "List",
  "ListChecks",
  "ListOrdered",
  "LoaderCircle",
  "Lock",
  "LockOpen",
  "Mail",
  "Maximize2",
  "Mic",
  "Minus",
  "MoreHorizontal",
  "Music",
  "Paperclip",
  "Pause",
  "Pencil",
  "Pilcrow",
  "Pin",
  "Play",
  "Plus",
  "Redo2",
  "Repeat",
  "RotateCcw",
  "Scissors",
  "Search",
  "Settings",
  "ShieldQuestionMark",
  "SkipBack",
  "SkipForward",
  "Sparkles",
  "SquareTerminal",
  "Strikethrough",
  "Table",
  "Tags",
  "TextQuote",
  "Trash2",
  "TriangleAlert",
  "Type",
  "Undo2",
  "User",
  "Video",
  "Volume2",
  "VolumeX",
  "X",
  "Zap",
];

/**
 * Peers the NODE consumer needs on disk to import every packed entry point.
 *
 * Only `react`, `react-dom` and `lucide-react` — the library's entire web peer
 * set. Every primitive renders through the seam's own DOM backend, so nothing
 * in `dist/node` imports `react-native-web`, the package no longer declares it
 * as a peer, and its stub is gone. If the import smoke ever fails on a missing
 * `react-native-web`, the seam regressed.
 */
export async function writeNodePeerStubs(consumerRoot) {
  await writeStubPackage(consumerRoot, "react", {
    "index.js": `export const Fragment = Symbol.for("react.fragment");
export function createContext(defaultValue) {
  return { Provider: ({ children }) => children, _currentValue: defaultValue };
}
export function createElement(type, props, ...children) {
  return { type, props: { ...(props ?? {}), children } };
}
export function cloneElement(element, props) {
  return { ...element, props: { ...(element?.props ?? {}), ...props } };
}
export function isValidElement(element) {
  return Boolean(element && typeof element === "object" && "props" in element);
}
export function forwardRef(render) {
  return render;
}
export function memo(component) {
  return component;
}
export function useCallback(callback) {
  return callback;
}
export function useId() {
  return "stub-id";
}
export function useImperativeHandle() {}
export function useContext(context) {
  return context?._currentValue;
}
export function useEffect() {}
export function useLayoutEffect() {}
export function useMemo(factory) {
  return factory();
}
export function useInsertionEffect() {}
export function useReducer(reducer, initial) {
  return [initial, () => {}];
}
export function useRef(value = null) {
  return { current: value };
}
export function useSyncExternalStore(subscribe, getSnapshot) {
  return getSnapshot();
}
export function useState(value) {
  return [typeof value === "function" ? value() : value, () => {}];
}
export const Children = {
  map(children, mapper) {
    return (Array.isArray(children) ? children : [children]).map(mapper);
  },
};
export default {
  Children,
  Fragment,
  cloneElement,
  createContext,
  createElement,
  forwardRef,
  isValidElement,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
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
  await writeStubPackage(consumerRoot, "lucide-react", {
    "index.js": `const Icon = () => null;
${ICON_NAMES.map((name) => `export const ${name} = Icon;`).join("\n")}
`,
    "package.json": JSON.stringify({ name: "lucide-react", type: "module" }),
  });
}

/**
 * Peers the TYPES consumer needs on disk to compile `dist/node/**` with
 * `skipLibCheck: false`. Only `react` and `lucide-react`: the web build's
 * declarations are self-contained, so a strict consumer needs neither
 * `react-native` (the seam types itself from `src/primitives/types`) nor
 * `react-native-web` (which ships no types and is never named in an emitted
 * declaration). If a `react-native` stub ever becomes necessary again, the
 * seam has started leaking React Native's types back into the package.
 */
export async function writeTypePeerStubs(consumerRoot) {
  await writeStubPackage(consumerRoot, "react", {
    "index.d.ts": `export type ComponentProps<T> = T extends ComponentType<infer P> ? P : T extends new (props: infer P) => unknown ? P : never;
export type ComponentPropsWithRef<T> = T extends (props: infer P) => ReactNode ? P : never;
export type ComponentType<P = unknown> = (props: P) => ReactNode;
export type ElementType = ComponentType<never> | string;
export type FC<P = unknown> = (props: P) => ReactNode;
export interface ForwardRefExoticComponent<P> {
  (props: P): ReactNode;
  displayName?: string | undefined;
}
export interface RefAttributes<T> {
  ref?: Ref<T> | undefined;
  key?: unknown;
}
export type Dispatch<T> = (value: T) => void;
export type PropsWithChildren<P = unknown> = P & { children?: ReactNode };
export interface ReactElement<P = unknown> {
  key: unknown;
  props: P;
  type: unknown;
}
export type ReactNode = unknown;
export type ReactPortal = unknown;
export type Ref<T> = ((instance: T | null) => void) | RefObject<T | null> | null;
export interface Context<T> {
  Provider: unknown;
  _currentValue?: T;
}
export interface RefObject<T> {
  current: T;
}
export interface MutableRefObject<T> {
  current: T;
}
export type SetStateAction<T> = T | ((previous: T) => T);
export declare function cloneElement<P>(
  element: ReactElement<P>,
  props?: Partial<P> & Record<string, unknown>,
): ReactElement<P>;
export declare function createContext<T>(defaultValue: T): Context<T>;
export declare function isValidElement<P = unknown>(
  value: unknown,
): value is ReactElement<P>;
export namespace JSX {
  export type Element = unknown;
}
`,
    "jsx-runtime.d.ts": `export namespace JSX {
  export type Element = unknown;
}
export declare function jsx(type: unknown, props: unknown): JSX.Element;
export declare const jsxs: typeof jsx;
export declare const Fragment: unique symbol;
`,
    "package.json": JSON.stringify({
      name: "react",
      type: "module",
      exports: {
        ".": {
          types: "./index.d.ts",
        },
        "./jsx-runtime": {
          types: "./jsx-runtime.d.ts",
        },
      },
    }),
  });
  await writeStubPackage(consumerRoot, "lucide-react", {
    "index.d.ts": `type Icon = (props: unknown) => unknown;
${ICON_NAMES.map((name) => `export declare const ${name}: Icon;`).join("\n")}
`,
    "package.json": JSON.stringify({
      name: "lucide-react",
      type: "module",
      types: "./index.d.ts",
    }),
  });
}

async function writeStubPackage(consumerRoot, packageName, files) {
  const packageRoot = join(consumerRoot, "node_modules", packageName);
  await mkdir(packageRoot, { recursive: true });
  await Promise.all(
    Object.entries(files).map(async ([fileName, body]) => {
      const path = join(packageRoot, fileName);
      // A stub may live in a subdirectory (a deep import into the real
      // package's `dist`), so its parent is created alongside it.
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, body);
    }),
  );
}
