import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

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
export function useRef(value = null) {
  return { current: value };
}
export function useState(value) {
  return [typeof value === "function" ? value() : value, () => {}];
}
export default {
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
  await writeStubPackage(consumerRoot, "react-native-web", {
    "index.js": `export const FlatList = "FlatList";
export const Image = "Image";
export const InputAccessoryView = "InputAccessoryView";
export const Modal = "Modal";
export const PanResponder = {
  create(config) {
    return { panHandlers: {}, config };
  },
};
export const Pressable = "Pressable";
export const ScrollView = "ScrollView";
export const Text = "Text";
export const TextInput = "TextInput";
export const View = "View";
export const Keyboard = {
  dismiss() {},
};
export const KeyboardAvoidingView = "KeyboardAvoidingView";
export const AccessibilityInfo = {
  announceForAccessibility() {},
  isReduceMotionEnabled() {
    return Promise.resolve(false);
  },
  addEventListener() {
    return { remove() {} };
  },
};
class AnimatedValue {
  interpolate() {
    return "0deg";
  }
}
export const Animated = {
  Value: AnimatedValue,
  View: "Animated.View",
  loop() {
    return { start() {}, stop() {} };
  },
  timing() {
    return { start() {}, stop() {} };
  },
};
export const Easing = {
  linear: (t) => t,
};
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
    "package.json": JSON.stringify({
      name: "react-native-web",
      type: "module",
    }),
  });
  await writeStubPackage(consumerRoot, "lucide-react", {
    "index.js": `const Icon = () => null;
${ICON_NAMES.map((name) => `export const ${name} = Icon;`).join("\n")}
`,
    "package.json": JSON.stringify({ name: "lucide-react", type: "module" }),
  });
}

export async function writeTypePeerStubs(consumerRoot) {
  await writeStubPackage(consumerRoot, "react", {
    "index.d.ts": `export type ComponentProps<T> = T extends ComponentType<infer P> ? P : T extends new (props: infer P) => unknown ? P : never;
export type ComponentType<P = unknown> = (props: P) => ReactNode;
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
  await writeStubPackage(consumerRoot, "react-native", {
    "index.d.ts": `export type StyleProp<T> = T | readonly T[] | false | null | undefined;
export type AccessibilityRole = string;
export interface PanResponderInstance {
  panHandlers: Record<string, unknown>;
}
export declare const PanResponder: {
  create(config: Record<string, unknown>): PanResponderInstance;
};
export interface AccessibilityState {
  [key: string]: unknown;
}
export type ColorValue = string | OpaqueColorValue;
export type DimensionValue = number | string | null | undefined;
export interface GestureResponderEvent {
  [key: string]: unknown;
}
export interface Insets {
  bottom?: number;
  left?: number;
  right?: number;
  top?: number;
}
export declare const OpaqueColorValue: unique symbol;
export type OpaqueColorValue = typeof OpaqueColorValue;
export interface TextInputProps {
  [key: string]: unknown;
}
export interface TextStyle {
  [key: string]: unknown;
}
export interface ViewStyle {
  [key: string]: unknown;
}
export interface FocusEvent {
  [key: string]: unknown;
}
export interface LayoutChangeEvent {
  [key: string]: unknown;
}
export interface NativeScrollEvent {
  [key: string]: unknown;
}
export interface NativeSyntheticEvent<T> {
  nativeEvent: T;
}
export interface TextInputContentSizeChangeEventData {
  [key: string]: unknown;
}
export interface TextProps {
  [key: string]: unknown;
}
export interface ViewProps {
  [key: string]: unknown;
}
export declare class FlatList<ItemT = unknown> {
  protected itemType?: ItemT;
}
export declare class Image {}
export declare class InputAccessoryView {}
export declare class KeyboardAvoidingView {}
export declare class Modal {}
export declare class ScrollView {}
export declare class Text {}
export declare class TextInput {}
export declare class View {}
export declare const AccessibilityInfo: Record<string, unknown>;
export declare const Easing: Record<string, unknown>;
export declare const Keyboard: Record<string, unknown>;
export declare const Platform: { OS: string };
export declare const Pressable: unknown;
export declare const StyleSheet: Record<string, unknown>;
export declare function useWindowDimensions(): {
  height: number;
  width: number;
};
export declare namespace Animated {
  class Value {
    constructor(value: number);
  }
  const View: unknown;
}
`,
    "package.json": JSON.stringify({
      name: "react-native",
      type: "module",
      types: "./index.d.ts",
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
    Object.entries(files).map(([fileName, body]) =>
      writeFile(join(packageRoot, fileName), body),
    ),
  );
}
