/**
 * `Animated`, as a JS-driven port of React Native's own.
 *
 * `react-native-web` 0.21.2 ships React Native's `Animated` vendored whole and
 * runs it with the JS driver; this folder is that driver transcribed, with the
 * native half (`__makeNative`, native tags, `useNativeDriver`) removed rather
 * than stubbed and the animations the library does not use (`spring`, `decay`,
 * `ValueXY`, `AnimatedColor`, `Animated.event`, `stagger`, `diffClamp` and the
 * arithmetic nodes) left out — the plan lists them as non-goals.
 *
 * What remains is the graph (`nodes.ts`, `AnimatedValue`,
 * `AnimatedInterpolation`, `AnimatedStyle`, `AnimatedProps`), the timing driver
 * (`TimingAnimation`), the compositions (`compositions.ts`), `Easing`, and
 * `createAnimatedComponent`, which re-renders its child every frame exactly as
 * that backend did.
 */
import type { AnimatedStatic, AnimatedValueConstructor } from "../../types";
import { Text } from "../Text";
import { View } from "../View";

import { AnimatedValue } from "./AnimatedValue";
import { createAnimatedComponent } from "./createAnimatedComponent";
import { delay, loop, parallel, sequence, timing } from "./compositions";

export { Easing } from "./Easing";

/** The `Animated` namespace object. */
export const Animated: AnimatedStatic = {
  createAnimatedComponent:
    createAnimatedComponent as AnimatedStatic["createAnimatedComponent"],
  delay,
  loop,
  parallel,
  sequence,
  Text: createAnimatedComponent(
    Text as never,
  ) as unknown as AnimatedStatic["Text"],
  timing: timing as unknown as AnimatedStatic["timing"],
  Value: AnimatedValue as unknown as AnimatedValueConstructor,
  View: createAnimatedComponent(
    View as never,
  ) as unknown as AnimatedStatic["View"],
};
