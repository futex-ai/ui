import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function writeNodePeerStubs(consumerRoot) {
  await writeStubPackage(consumerRoot, "react", {
    "index.js": `export const Fragment = Symbol.for("react.fragment");
export function createContext(defaultValue) {
  return { Provider: ({ children }) => children, _currentValue: defaultValue };
}
export function useCallback(callback) {
  return callback;
}
export function useContext(context) {
  return context?._currentValue;
}
export function useEffect() {}
export function useLayoutEffect() {}
export function useMemo(factory) {
  return factory();
}
export function useRef(value = null) {
  return { current: value };
}
export function useState(value) {
  return [typeof value === "function" ? value() : value, () => {}];
}
export default {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
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
  await writeStubPackage(consumerRoot, "react-native", {
    "index.js": `export const Modal = "Modal";
export const Pressable = "Pressable";
export const ScrollView = "ScrollView";
export const Text = "Text";
export const TextInput = "TextInput";
export const View = "View";
export const Platform = {
  OS: "web",
  select(values) {
    return values.web ?? values.default;
  },
};
export const StyleSheet = {
  absoluteFillObject: {},
  create(styles) {
    return styles;
  },
  flatten(styles) {
    return styles;
  },
};
export function useWindowDimensions() {
  return { fontScale: 1, height: 768, scale: 1, width: 1024 };
}
`,
    "package.json": JSON.stringify({ name: "react-native", type: "module" }),
  });
  await writeStubPackage(consumerRoot, "react-native-svg", {
    "index.js": `export default "Svg";
`,
    "package.json": JSON.stringify({
      name: "react-native-svg",
      type: "module",
    }),
  });
  await writeStubPackage(consumerRoot, "lucide-react-native", {
    "index.js": `const Icon = () => null;
export const CalendarDays = Icon;
export const Check = Icon;
export const ChevronDown = Icon;
export const ChevronLeft = Icon;
export const ChevronRight = Icon;
export const CircleX = Icon;
export const Search = Icon;
export const X = Icon;
`,
    "package.json": JSON.stringify({
      name: "lucide-react-native",
      type: "module",
    }),
  });
}

export async function writeTypePeerStubs(consumerRoot) {
  await writeStubPackage(consumerRoot, "react", {
    "index.d.ts": `export type Dispatch<T> = (value: T) => void;
export type ReactNode = unknown;
export type ReactPortal = unknown;
export type Ref<T> = ((instance: T | null) => void) | RefObject<T | null> | null;
export interface RefObject<T> {
  current: T;
}
export type SetStateAction<T> = T | ((previous: T) => T);
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
  await writeStubPackage(consumerRoot, "react-native", {
    "index.d.ts": `export type StyleProp<T> = T | readonly T[] | false | null | undefined;
export interface TextInputProps {
  [key: string]: unknown;
}
export interface TextStyle {
  [key: string]: unknown;
}
export interface ViewStyle {
  [key: string]: unknown;
}
export declare class TextInput {}
export declare class View {}
`,
    "package.json": JSON.stringify({
      name: "react-native",
      type: "module",
      types: "./index.d.ts",
    }),
  });
  await writeStubPackage(consumerRoot, "lucide-react-native", {
    "index.d.ts": `export type LucideIcon = (props: unknown) => unknown;
`,
    "package.json": JSON.stringify({
      name: "lucide-react-native",
      type: "module",
      types: "./index.d.ts",
    }),
  });
}

async function writeStubPackage(consumerRoot, packageName, files) {
  const packageRoot = join(consumerRoot, "node_modules", packageName);
  await mkdir(packageRoot, { recursive: true });
  await Promise.all(
    Object.entries(files).map(([fileName, body]) =>
      writeFile(join(packageRoot, fileName), body),
    ),
  );
}
