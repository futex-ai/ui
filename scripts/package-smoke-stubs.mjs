import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function writeNodePeerStubs(consumerRoot) {
  await writeStubPackage(consumerRoot, "react", {
    "index.js": `export const Fragment = Symbol.for("react.fragment");
export function createContext(defaultValue) {
  return { Provider: ({ children }) => children, _currentValue: defaultValue };
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
  await writeStubPackage(consumerRoot, "react-native", {
    "index.js": `export const FlatList = "FlatList";
export const Image = "Image";
export const InputAccessoryView = "InputAccessoryView";
export const Modal = "Modal";
export const Pressable = "Pressable";
export const ScrollView = "ScrollView";
export const Text = "Text";
export const TextInput = "TextInput";
export const View = "View";
export const Keyboard = {
  dismiss() {},
};
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
    "package.json": JSON.stringify({ name: "react-native", type: "module" }),
  });
  await writeStubPackage(consumerRoot, "react-native-svg", {
    "index.js": `export const Circle = "Circle";
export const Defs = "Defs";
export const LinearGradient = "LinearGradient";
export const Path = "Path";
export const Rect = "Rect";
export const Stop = "Stop";
export const Svg = "Svg";
export default Svg;
`,
    "package.json": JSON.stringify({
      name: "react-native-svg",
      type: "module",
    }),
  });
  await writeStubPackage(consumerRoot, "lucide-react-native", {
    "index.js": `const Icon = () => null;
export const ArrowDownAZ = Icon;
export const ArrowLeftToLine = Icon;
export const ArrowRightToLine = Icon;
export const ArrowUpAZ = Icon;
export const AudioWaveform = Icon;
export const Bold = Icon;
export const Brain = Icon;
export const Calendar = Icon;
export const CalendarDays = Icon;
export const Check = Icon;
export const ChevronDown = Icon;
export const ChevronFirst = Icon;
export const ChevronLast = Icon;
export const ChevronLeft = Icon;
export const ChevronRight = Icon;
export const CircleAlert = Icon;
export const CircleCheck = Icon;
export const CircleX = Icon;
export const Code = Icon;
export const Diamond = Icon;
export const Download = Icon;
export const Eye = Icon;
export const EyeOff = Icon;
export const Film = Icon;
export const Gauge = Icon;
export const GitBranch = Icon;
export const Grid2x2 = Icon;
export const GripHorizontal = Icon;
export const GripVertical = Icon;
export const Hash = Icon;
export const Heading1 = Icon;
export const Heading2 = Icon;
export const Heading3 = Icon;
export const Headphones = Icon;
export const Inbox = Icon;
export const Info = Icon;
export const Italic = Icon;
export const Layers = Icon;
export const LayoutGrid = Icon;
export const List = Icon;
export const ListChecks = Icon;
export const ListOrdered = Icon;
export const LoaderCircle = Icon;
export const Lock = Icon;
export const LockOpen = Icon;
export const Magnet = Icon;
export const Maximize2 = Icon;
export const Minus = Icon;
export const MousePointer2 = Icon;
export const Move = Icon;
export const Music = Icon;
export const Pause = Icon;
export const Pilcrow = Icon;
export const Play = Icon;
export const Plus = Icon;
export const Redo2 = Icon;
export const Repeat = Icon;
export const RotateCcw = Icon;
export const Ruler = Icon;
export const Scissors = Icon;
export const Search = Icon;
export const Settings2 = Icon;
export const SkipBack = Icon;
export const SkipForward = Icon;
export const SlidersHorizontal = Icon;
export const Sparkles = Icon;
export const SquareTerminal = Icon;
export const Strikethrough = Icon;
export const Tags = Icon;
export const TextQuote = Icon;
export const Timer = Icon;
export const Trash2 = Icon;
export const TriangleAlert = Icon;
export const Type = Icon;
export const Undo2 = Icon;
export const Video = Icon;
export const Volume2 = Icon;
export const VolumeX = Icon;
export const WandSparkles = Icon;
export const X = Icon;
export const Zap = Icon;
export const ZoomIn = Icon;
export const ZoomOut = Icon;
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
export interface AccessibilityState {
  [key: string]: unknown;
}
export type ColorValue = string | OpaqueColorValue;
export type DimensionValue = number | string | null | undefined;
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
