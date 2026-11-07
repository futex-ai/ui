import { createContext, useContext, type ReactNode } from "react";

import {
  denseControl,
  denseRow,
  touchControl,
  touchRow,
  type ControlMetrics,
  type RowMetrics,
} from "../../design/density";
import styles from "./Surface.module.css";

/** The kind of surface that a screen marks explicitly. */
export type SurfaceKind = "desktop" | "phone";

const SurfaceContext = createContext<SurfaceKind>("desktop");

/**
 * A dense desktop surface: `xs` controls, 26 px rows, and the compact type
 * scale. The renderer writes its metrics for `data-surface="desktop"`.
 */
export function DesktopSurface(props: { children: ReactNode }) {
  return (
    <SurfaceContext.Provider value="desktop">
      <div className={styles.desktop} data-surface="desktop">
        {props.children}
      </div>
    </SurfaceContext.Provider>
  );
}

/**
 * A touch surface, such as a phone. Every control and row is at least
 * 44 px high, and the text keeps the default type scale. The screen marks
 * it. Nothing reads the width of the viewport.
 */
export function PhoneSurface(props: { children: ReactNode }) {
  return (
    <SurfaceContext.Provider value="phone">
      <div className={styles.phone} data-surface="phone">
        {props.children}
      </div>
    </SurfaceContext.Provider>
  );
}

/** The surface that the nearest screen marked. */
export function useSurface(): SurfaceKind {
  return useContext(SurfaceContext);
}

/** The control metrics of the nearest surface. */
export function useControlMetrics(): ControlMetrics {
  return useSurface() === "phone" ? touchControl : denseControl;
}

/** The row metrics of the nearest surface. */
export function useRowMetrics(): RowMetrics {
  return useSurface() === "phone" ? touchRow : denseRow;
}
