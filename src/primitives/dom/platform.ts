/**
 * The small non-component primitives: `Platform`, `useWindowDimensions`,
 * `AccessibilityInfo` and `Keyboard`.
 *
 * Each one answers exactly what `react-native-web` answered, because the
 * library branches on the answers: `Platform.OS === "web"` guards 49 call
 * sites, `useReducedMotion` subscribes to the reduce-motion media query, and
 * `announcer.ts` already owns the web announcement path, which is why
 * `announceForAccessibility` stays a no-op here.
 */
import { useCallback, useSyncExternalStore } from "react";

import type {
  AccessibilityInfoStatic,
  EmitterSubscription,
  KeyboardStatic,
  PlatformStatic,
  ScaledSize,
} from "../types";

export const Platform: PlatformStatic = {
  OS: "web",
  Version: "0.0.0",
  isTV: false,
  isTesting: false,
  select: ((specifics: Record<string, unknown>) =>
    "web" in specifics
      ? specifics.web
      : specifics.default) as PlatformStatic["select"],
};

const SERVER_DIMENSIONS: ScaledSize = {
  fontScale: 1,
  height: 0,
  scale: 1,
  width: 0,
};

function measureWindow(): ScaledSize {
  if (typeof window === "undefined") {
    return SERVER_DIMENSIONS;
  }
  // The visual viewport is preferred because iOS leaves the document element's
  // size unchanged when the on-screen keyboard opens; the scale factor undoes
  // pinch zoom, which the document element also ignores.
  const viewport = window.visualViewport;
  return {
    fontScale: 1,
    height:
      viewport != null
        ? Math.round(viewport.height * viewport.scale)
        : document.documentElement.clientHeight,
    scale: window.devicePixelRatio || 1,
    width:
      viewport != null
        ? Math.round(viewport.width * viewport.scale)
        : document.documentElement.clientWidth,
  };
}

let currentDimensions: ScaledSize = SERVER_DIMENSIONS;
let measured = false;
const dimensionListeners = new Set<() => void>();

function readDimensions(): ScaledSize {
  if (!measured) {
    currentDimensions = measureWindow();
    measured = true;
  }
  return currentDimensions;
}

function handleResize() {
  const next = measureWindow();
  if (
    next.width !== currentDimensions.width ||
    next.height !== currentDimensions.height ||
    next.scale !== currentDimensions.scale
  ) {
    currentDimensions = next;
    for (const listener of dimensionListeners) {
      listener();
    }
  }
}

function subscribeToDimensions(listener: () => void): () => void {
  if (dimensionListeners.size === 0 && typeof window !== "undefined") {
    window.addEventListener("resize", handleResize, false);
  }
  dimensionListeners.add(listener);
  // A resize between the render that read the size and this subscription would
  // otherwise be missed.
  handleResize();
  return () => {
    dimensionListeners.delete(listener);
    if (dimensionListeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("resize", handleResize, false);
    }
  };
}

/** The window's size, kept current as it resizes. */
export function useWindowDimensions(): ScaledSize {
  const subscribe = useCallback(subscribeToDimensions, []);
  return useSyncExternalStore(
    subscribe,
    readDimensions,
    () => SERVER_DIMENSIONS,
  );
}

const reducedMotionQuery =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

const reduceMotionListeners = new Map<
  (value: boolean) => void,
  (event: MediaQueryListEvent) => void
>();

export const AccessibilityInfo: AccessibilityInfoStatic = {
  addEventListener(eventName, handler): EmitterSubscription {
    if (eventName === "reduceMotionChanged" && reducedMotionQuery != null) {
      const listener = (event: MediaQueryListEvent) => handler(event.matches);
      reduceMotionListeners.set(handler, listener);
      reducedMotionQuery.addEventListener("change", listener);
    }
    return {
      remove() {
        const listener = reduceMotionListeners.get(handler);
        if (listener != null && reducedMotionQuery != null) {
          reducedMotionQuery.removeEventListener("change", listener);
          reduceMotionListeners.delete(handler);
        }
      },
    };
  },
  // The web announcement path is `announcer.ts`'s live region, not this.
  announceForAccessibility() {},
  isReduceMotionEnabled: () =>
    // No media query means no way to tell, and the accessible answer is to
    // assume motion is unwanted — which is what the previous backend answered.
    Promise.resolve(
      reducedMotionQuery != null ? reducedMotionQuery.matches : true,
    ),
  isScreenReaderEnabled: () => Promise.resolve(true),
};

/**
 * Whether a node is the kind of field a software keyboard is open for.
 *
 * `Keyboard.dismiss` blurs only those, the way that backend's
 * `TextInputState.blurTextInput` did — blurring any focused element would also
 * throw away the focus ring on a button that happens to be active.
 */
export function isTextInputNode(node: unknown): boolean {
  const element = node as
    | { isContentEditable?: boolean; tagName?: string }
    | null
    | undefined;
  const tagName = element?.tagName?.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    element?.isContentEditable === true
  );
}

export const Keyboard: KeyboardStatic = {
  addListener: () => ({ remove() {} }),
  dismiss() {
    const active =
      typeof document !== "undefined" ? document.activeElement : null;
    if (active instanceof HTMLElement && isTextInputNode(active)) {
      active.blur();
    }
  },
};
