import type { ComponentType } from "react";

/**
 * Props every icon slot in the library passes to the icon it is handed.
 *
 * Deliberately the intersection of what `lucide-react-native` and
 * `lucide-react` accept, so a consumer can pass an icon from whichever Lucide
 * package matches their platform, or any component of their own that honours
 * these props.
 */
export type IconComponentProps = {
  /** Set when a visible label already names the control. */
  "aria-hidden"?: boolean;
  /** Stroke colour; the library always passes a theme colour string. */
  color?: string;
  /** Square edge length in px. */
  size?: number | string;
  /** Stroke width in SVG user units. */
  strokeWidth?: number | string;
};

/**
 * An icon component accepted by every `icon` / `prefixIcon` / `labelInfoIcon`
 * style prop. Both Lucide packages' icons satisfy it.
 */
export type IconComponent = ComponentType<IconComponentProps>;
