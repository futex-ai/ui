import { createContext, useContext, type ReactNode } from "react";
import { TouchSurface } from "@firna/ui/touch-surface";
import { TextScaleProvider } from "@firna/ui/typography";

import styles from "./Surface.module.css";

/** The kind of surface that a screen marks explicitly. */
export type SurfaceKind = "desktop" | "phone";

const SurfaceContext = createContext<SurfaceKind>("desktop");

/**
 * A dense desktop surface. The library text inside it takes the compact
 * scale, and the screens give their controls the `xs` size. The renderer
 * writes the layout numbers of the surface for `data-surface="desktop"`.
 */
export function DesktopSurface(props: { children: ReactNode }) {
  return (
    <SurfaceContext.Provider value="desktop">
      <TextScaleProvider scale="compact">
        <div className={styles.desktop} data-surface="desktop">
          {props.children}
        </div>
      </TextScaleProvider>
    </SurfaceContext.Provider>
  );
}

/**
 * A touch surface, such as a phone. The library marks it with
 * `TouchSurface`, so every control and row inside is at least 44 px high,
 * whatever its size, and the text keeps the default scale. The screen marks
 * it. Nothing reads the width of the viewport.
 */
export function PhoneSurface(props: { children: ReactNode }) {
  return (
    <SurfaceContext.Provider value="phone">
      <TouchSurface>
        <div className={styles.phone} data-surface="phone">
          {props.children}
        </div>
      </TouchSurface>
    </SurfaceContext.Provider>
  );
}

/** The surface that the nearest screen marked. */
export function useSurface(): SurfaceKind {
  return useContext(SurfaceContext);
}

/**
 * The size of a decorative glyph in a row or beside a control: the `xs`
 * icon on desktop and the 18 px touch icon on a phone.
 */
export function useGlyphSize(): number {
  return useSurface() === "phone" ? 18 : 14;
}
