import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

/**
 * Decision 7 of `plans/pure-react-dom-backend.md`: the vendored types in
 * `src/primitives/types` are copied from React Native's so "a native
 * consumer's RN-typed `style` still flows into a component prop typed with
 * ours". That is an assignability contract, and trimming a union or a member
 * breaks it silently — `npm run typecheck` cannot see it, because the library's
 * own code never mixes the two type worlds.
 *
 * So this compiles a probe that does mix them, against the real `react-native`
 * declarations, and fails if any assignment stops working. Both directions
 * matter: a value flows RN → ours, while a *callback* flows ours → RN's,
 * because handler props are contravariant in their parameter (a consumer's
 * `(e: RNLayoutChangeEvent) => void` has to satisfy our `onLayout`).
 *
 * The probe is written under `node_modules` so the bare `react-native`
 * specifier and the relative `src` one both resolve the way they do in the
 * repo, and is removed afterwards.
 */
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const probeRoot = join(repoRoot, "node_modules", ".firna-type-probe");
const tsc = join(repoRoot, "node_modules", "typescript", "bin", "tsc");

const PROBE = `import type {
  GestureResponderEvent as RNGestureResponderEvent,
  LayoutChangeEvent as RNLayoutChangeEvent,
  NativeScrollEvent as RNNativeScrollEvent,
  NativeSyntheticEvent as RNNativeSyntheticEvent,
  StyleProp as RNStyleProp,
  TextInputContentSizeChangeEventData as RNTextInputContentSizeChangeEventData,
  TextInputProps as RNTextInputProps,
  TextProps as RNTextProps,
  TextStyle as RNTextStyle,
  ViewProps as RNViewProps,
  ViewStyle as RNViewStyle,
} from "react-native";
import type {
  GestureResponderEvent,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  TextInputContentSizeChangeEventData,
  TextInputProps,
  TextProps,
  TextStyle,
  ViewProps,
  ViewStyle,
} from "../../src/primitives/types";

// A React Native style, prop bag, or event flows into one of ours.
declare const rnViewStyle: RNViewStyle;
declare const rnTextStyle: RNTextStyle;
declare const rnStyleProp: RNStyleProp<RNViewStyle>;
declare const rnViewProps: RNViewProps;
declare const rnTextProps: RNTextProps;
declare const rnTextInputProps: RNTextInputProps;
declare const rnLayoutEvent: RNLayoutChangeEvent;
export const viewStyle: ViewStyle = rnViewStyle;
export const textStyle: TextStyle = rnTextStyle;
export const styleProp: StyleProp<ViewStyle> = rnStyleProp;
export const viewProps: ViewProps = rnViewProps;
export const textProps: TextProps = rnTextProps;
export const textInputProps: TextInputProps = rnTextInputProps;
export const layoutEvent: LayoutChangeEvent = rnLayoutEvent;

// One of our events flows back into a React Native typed slot.
declare const ourLayoutEvent: LayoutChangeEvent;
declare const ourGestureEvent: GestureResponderEvent;
declare const ourScrollEvent: NativeSyntheticEvent<NativeScrollEvent>;
export const rnLayout: RNLayoutChangeEvent = ourLayoutEvent;
export const rnGesture: RNGestureResponderEvent = ourGestureEvent;
export const rnScroll: RNNativeSyntheticEvent<RNNativeScrollEvent> =
  ourScrollEvent;

// A handler a consumer already typed with React Native's events satisfies the
// matching prop of ours (parameter contravariance).
declare function takesOnLayout(handler: (event: LayoutChangeEvent) => void): void;
declare function takesOnPress(handler: (event: GestureResponderEvent) => void): void;
declare function takesOnContentSize(
  handler: (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) => void,
): void;
declare const rnOnLayout: (event: RNLayoutChangeEvent) => void;
declare const rnOnPress: (event: RNGestureResponderEvent) => void;
declare const rnOnContentSize: (
  event: RNNativeSyntheticEvent<RNTextInputContentSizeChangeEventData>,
) => void;
takesOnLayout(rnOnLayout);
takesOnPress(rnOnPress);
takesOnContentSize(rnOnContentSize);
`;

const PROBE_TSCONFIG = {
  compilerOptions: {
    jsx: "react-jsx",
    lib: ["DOM", "ES2024"],
    module: "ESNext",
    moduleResolution: "Bundler",
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: "ES2022",
    types: [],
  },
  include: ["probe.ts"],
};

test("the vendored types stay assignable from react-native's", () => {
  if (!existsSync(join(repoRoot, "node_modules", "react-native"))) {
    // The compat contract is about native consumers; without React Native's
    // own declarations on disk there is nothing to compare against.
    console.log("skipped: react-native is not installed");
    return;
  }
  rmSync(probeRoot, { force: true, recursive: true });
  mkdirSync(probeRoot, { recursive: true });
  try {
    writeFileSync(join(probeRoot, "probe.ts"), PROBE);
    writeFileSync(
      join(probeRoot, "tsconfig.json"),
      JSON.stringify(PROBE_TSCONFIG),
    );
    let output = "";
    let failed = false;
    try {
      execFileSync(process.execPath, [tsc, "--project", probeRoot], {
        encoding: "utf8",
        stdio: "pipe",
      });
    } catch (error) {
      failed = true;
      const result = error as { stdout?: string; stderr?: string };
      output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    }
    assert.ok(
      !failed,
      `A vendored type diverged from react-native's. Widen ours — never narrow a union or drop a member React Native declares:\n${output}`,
    );
  } finally {
    rmSync(probeRoot, { force: true, recursive: true });
  }
});
