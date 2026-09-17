/**
 * `Image`, as an `img` inside a `View`.
 *
 * `react-native-web` painted the picture as a `background-image` on an
 * absolutely positioned child and kept a transparent `img` for its accessible
 * name; the same frame, fit and name come out of a real `img` with
 * `object-fit`, which is one element fewer and gives the browser its usual
 * loading and decoding behaviour. The wrapper keeps that backend's own extra
 * styles (`flex-basis: auto`, `overflow: hidden`, `z-index: 0`) so a caller's
 * `style` lands on the same box it used to.
 */
import { forwardRef } from "react";

import type {
  ImageComponent,
  ImageInstance,
  ImageProps,
  ViewProps,
} from "../types";

import { objectFitFor } from "./imageFit";
import { View } from "./View";

const WRAPPER_STYLE = {
  flexBasis: "auto",
  overflow: "hidden",
  zIndex: 0,
} as const;

const IMG_STYLE = {
  height: "100%",
  inset: 0,
  position: "absolute",
  width: "100%",
} as const;

function sourceUri(source: ImageProps["source"]): string | undefined {
  if (typeof source === "string") {
    return source;
  }
  if (Array.isArray(source)) {
    return source[0]?.uri;
  }
  return typeof source === "object" && source !== null
    ? (source as { uri?: string }).uri
    : undefined;
}

export const Image: ImageComponent = forwardRef<ImageInstance, ImageProps>(
  function Image(props, forwardedRef) {
    const { alt, onError, onLoad, resizeMode, source, style, ...rest } =
      props as ImageProps & {
        onError?: (event: never) => void;
        onLoad?: (event: never) => void;
      };
    const uri = sourceUri(source);
    const viewProps = {
      ...rest,
      style: [WRAPPER_STYLE, style],
    } as unknown as ViewProps;
    return (
      <View {...viewProps} ref={forwardedRef}>
        {uri == null ? null : (
          <img
            // The wrapper is the accessible element — it takes the role and
            // the label through the usual `View` mapping — so the picture
            // itself is decorative unless the caller spelled an `alt`. The
            // previous backend got the same single node by hiding its
            // accessibility image behind `opacity: 0`.
            alt={alt ?? ""}
            draggable={false}
            onError={onError as never}
            onLoad={onLoad as never}
            src={uri}
            style={{ ...IMG_STYLE, objectFit: objectFitFor(resizeMode, style) }}
          />
        )}
      </View>
    );
  },
);
Image.displayName = "Image";
