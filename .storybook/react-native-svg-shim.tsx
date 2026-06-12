import React, { forwardRef } from "react";

type SvgProps = React.SVGProps<SVGSVGElement> & {
  color?: string;
  size?: number | string;
};

type SvgChildProps = React.SVGProps<SVGElement>;

function createChildElement(tag: keyof SVGElementTagNameMap) {
  return function SvgChild(props: SvgChildProps) {
    return React.createElement(tag, props);
  };
}

export const Svg = forwardRef<SVGSVGElement, SvgProps>(function Svg(
  { children, color, height, size, width, ...props },
  ref,
) {
  return (
    <svg
      ref={ref}
      color={color}
      height={height ?? size}
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
