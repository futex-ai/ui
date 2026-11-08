import { createContext, useContext, type ReactNode } from "react";

/** The least width and height of a target on a touch surface, in px. */
export const TOUCH_TARGET_SIZE = 44;

const TouchSurfaceContext = createContext(false);

export type TouchSurfaceProps = {
  children: ReactNode;
  /**
   * Whether the subtree is a touch surface. Defaults to `true`. A nested
   * `enabled={false}` returns a region to the metrics of its sizes.
   */
  enabled?: boolean;
};

/**
 * Marks a touch surface, such as a phone layout. The library controls inside
 * it use the touch metrics, whatever their `size`: targets of at least 44 by
 * 44px, 15px control labels, 18px icons, 16px field text, and rows of at least
 * 44px. The caller marks the surface: nothing reads the viewport, the pointer,
 * or the platform, so static and server-rendered markup already has the touch
 * sizes of the first client render.
 */
export function TouchSurface({ children, enabled = true }: TouchSurfaceProps) {
  return (
    <TouchSurfaceContext.Provider value={enabled}>
      {children}
    </TouchSurfaceContext.Provider>
  );
}

/**
 * Whether the nearest {@link TouchSurface} marks this subtree. A control of
 * the caller's own can read it to give its targets the same 44px floor.
 */
export function useTouchSurface(): boolean {
  return useContext(TouchSurfaceContext);
}
