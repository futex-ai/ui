import React, { forwardRef } from "react";

type SvgProps = React.SVGProps<SVGSVGElement> & {
  color?: string;
  size?: number | string;
};

type SvgChildProps = React.SVGProps<SVGElement>;

// Collapse a React Native style value into a single plain object the DOM can
// take. `Animated.createAnimatedComponent` ALWAYS hands its child a `style`
// ARRAY (`[style, passthroughStyle]`); the real `react-native-svg` web build
// flattens that, but this shim passes props straight to a DOM node, where an
// array `style` makes React throw "Indexed property setter is not supported" on
// `CSSStyleDeclaration[0]`. Flatten nested arrays and drop nullish entries so an
// animated SVG child (e.g. the AnimatedBorder trail) renders.
function flattenStyle(style: unknown): React.CSSProperties | undefined {
  if (style == null || style === false) {
    return undefined;
  }
  if (Array.isArray(style)) {
    return style.reduce<React.CSSProperties>((merged, entry) => {
      const flat = flattenStyle(entry);
      return flat ? { ...merged, ...flat } : merged;
    }, {});
  }
  return style as React.CSSProperties;
}

// Forward the ref to the underlying DOM element. `react-native-svg`'s nodes
// accept refs on native, and `Animated.createAnimatedComponent` attaches one to
// drive imperative updates — so the web shim must accept a ref too, otherwise an
// animated SVG child (e.g. the AnimatedBorder trail) logs a "function components
// cannot be given refs" warning.
function createChildElement(tag: keyof SVGElementTagNameMap) {
  return forwardRef<SVGElement, SvgChildProps>(function SvgChild(
    { style, ...props },
    ref,
  ) {
    return React.createElement(tag, {
      ...props,
      ref,
      style: flattenStyle(style),
    });
  });
}

export const Svg = forwardRef<SVGSVGElement, SvgProps>(function Svg(
  { children, color, height, size, style, width, ...props },
  ref,
) {
  return (
    <svg
      ref={ref}
      color={color}
      height={height ?? size}
      style={flattenStyle(style)}
      width={width ?? size}
      {...props}
    >
      {children}
    </svg>
  );
});

export const Circle = createChildElement("circle");
export const ClipPath = createChildElement("clipPath");
export const Defs = createChildElement("defs");
export const Ellipse = createChildElement("ellipse");
export const G = createChildElement("g");
export const Line = createChildElement("line");
export const LinearGradient = createChildElement("linearGradient");
export const Mask = createChildElement("mask");
export const Path = createChildElement("path");
export const Pattern = createChildElement("pattern");
export const Polygon = createChildElement("polygon");
export const Polyline = createChildElement("polyline");
export const RadialGradient = createChildElement("radialGradient");
export const Rect = createChildElement("rect");
export const Stop = createChildElement("stop");
export const Symbol = createChildElement("symbol");
export const Text = createChildElement("text");
export const TSpan = createChildElement("tspan");
export const Use = createChildElement("use");

export default Svg;
