import { createContext, useContext, type ReactNode } from "react";

import type { TextScale } from "./typographyStyles";

const TextScaleContext = createContext<TextScale>("default");

export type TextScaleProviderProps = {
  children: ReactNode;
  /** The scale of the text roles inside. */
  scale: TextScale;
};

/**
 * Chooses the type scale of the {@link Text} roles inside, on web and native.
 * Wrap a dense surface in `scale="compact"` for 13px body text. A `Text` can
 * override the scale for itself with its own `scale`, and a nested provider
 * changes it for a region. Control labels follow the control sizes instead,
 * and field labels, hints, and errors keep their metrics.
 */
export function TextScaleProvider({ children, scale }: TextScaleProviderProps) {
  return (
    <TextScaleContext.Provider value={scale}>
      {children}
    </TextScaleContext.Provider>
  );
}

/** The type scale that the nearest {@link TextScaleProvider} chooses. */
export function useTextScale(): TextScale {
  return useContext(TextScaleContext);
}
