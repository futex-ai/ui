import { Text, type TextProps } from "@firna/ui/typography";

import { compactText } from "../../design/typeScale";
import { useSurface } from "./Surface";

/**
 * The library `Text`, with the compact type scale on a desktop surface. A
 * phone surface keeps the default scale. Colour, casing, and heading level
 * stay with the role.
 */
export function Txt(props: TextProps) {
  const desktop = useSurface() === "desktop";
  const scale = desktop ? compactText[props.variant ?? "body"] : undefined;
  return <Text {...props} style={[scale, props.style]} />;
}
