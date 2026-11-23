/**
 * Public platform primitives for shared views.
 *
 * iOS and Android use React Native and React Native SVG. Web uses the
 * library's DOM backend and DOM SVG elements. The entry also exposes the link
 * host, the server-rendering stylesheet, and shared icon component types.
 */
export { domBackendCss } from "./domBackendCss";
export type { IconComponent, IconComponentProps } from "./iconTypes";
export * from "./link";
export * from "./reactNative";
export * from "./svg";
export { default as Svg } from "./svg";
