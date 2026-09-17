/**
 * Wrapping a component so its props may be animated nodes.
 *
 * Transcribed from React Native's `Animated/createAnimatedComponent.js` and
 * `useAnimatedProps.js` as `react-native-web` 0.21.2 vendors them. The JS
 * driver re-renders the wrapped component on every frame — it does **not**
 * mutate the host node — which is what lets an animated value drive an ordinary
 * attribute (`strokeDashoffset` on an SVG `Rect`) as easily as a style, and is
 * the model the library's thirteen `Animated` consumers were written against.
 *
 * Two shapes are kept verbatim because callers depend on them: `collapsable`
 * is still forwarded (`AnimatedBorder`'s `DomSafeRect` exists to strip it), and
 * `style` is always handed on as an array (`svg.web.tsx` flattens it for the
 * same reason).
 */
import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  type ComponentType,
  type ForwardedRef,
  type ReactElement,
} from "react";

import { AnimatedProps } from "./AnimatedProps";

type PropBag = Record<string, unknown>;

// `useLayoutEffect` warns during server rendering, which the seam supports.
const useLayoutEffectSafe =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** A callback ref that runs an effect on attach and its cleanup on detach. */
function useRefEffect<T>(
  effect: (instance: T) => (() => void) | undefined,
): (instance: T | null) => void {
  const cleanupRef = useRef<(() => void) | undefined>(undefined);
  return useCallback(
    (instance: T | null) => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = undefined;
      }
      if (instance != null) {
        cleanupRef.current = effect(instance);
      }
    },
    [effect],
  );
}

/** Attaches the node for as long as it is the current one. */
function useAnimatedPropsLifecycle(node: AnimatedProps): void {
  const prevNodeRef = useRef<AnimatedProps | null>(null);
  const isUnmountingRef = useRef(false);

  useLayoutEffectSafe(() => {
    isUnmountingRef.current = false;
    return () => {
      isUnmountingRef.current = true;
    };
  }, []);

  useLayoutEffectSafe(() => {
    node.__attach();
    if (prevNodeRef.current != null) {
      prevNodeRef.current.__detach();
      prevNodeRef.current = null;
    }
    return () => {
      if (isUnmountingRef.current) {
        node.__detach();
      } else {
        // A prop change replaced the node; the old one is detached once the new
        // one has attached, so the value never loses all its children in between.
        prevNodeRef.current = node;
      }
    };
  }, [node]);
}

/** Resolves `props` through an `AnimatedProps` node and re-renders on update. */
function useAnimatedProps(
  props: PropBag,
): [PropBag, (instance: unknown) => void] {
  const [, scheduleUpdate] = useReducer((count: number) => count + 1, 0);
  const onUpdateRef = useRef<(() => void) | null>(null);

  const node = useMemo(
    () => new AnimatedProps(props, () => onUpdateRef.current?.()),
    [props],
  );
  useAnimatedPropsLifecycle(node);

  const refEffect = useCallback(() => {
    // Only the JS driver uses this: re-render rather than compute now, so a
    // parent that updated in the same frame is merged in first.
    onUpdateRef.current = () => scheduleUpdate();
    return () => {
      onUpdateRef.current = null;
    };
  }, []);
  const callbackRef = useRefEffect<unknown>(refEffect);

  // `collapsable: false` is forwarded exactly as that backend forwarded it.
  return [{ ...node.__getValue(), collapsable: false }, callbackRef];
}

/** Wraps a component so every prop accepts an animated node. */
export function createAnimatedComponent<P extends object>(
  Component: ComponentType<P> | string,
): ComponentType<P> {
  const Animated = forwardRef(function AnimatedComponent(
    props: PropBag,
    forwardedRef: ForwardedRef<unknown>,
  ): ReactElement {
    const [reducedProps, callbackRef] = useAnimatedProps(props);
    const setRef = useCallback(
      (instance: unknown) => {
        callbackRef(instance);
        if (typeof forwardedRef === "function") {
          forwardedRef(instance);
        } else if (forwardedRef != null) {
          forwardedRef.current = instance;
        }
      },
      [callbackRef, forwardedRef],
    );
    return createElement(Component as ComponentType<PropBag>, {
      ...reducedProps,
      ref: setRef,
      // Always an array, as that backend's `[style, passthroughStyle]` was.
      style: [reducedProps.style],
    });
  });
  const name =
    typeof Component === "string"
      ? Component
      : (Component.displayName ?? Component.name ?? "Component");
  Animated.displayName = `Animated(${name})`;
  return Animated as unknown as ComponentType<P>;
}
