/**
 * Creating a DOM element whose tag is only known at runtime.
 *
 * The role table picks the tag (`div`, `button`, `h2`, `li`, …) and the prop
 * bag is assembled dynamically, so this is the one place the backend has to
 * tell TypeScript that the bag matches the element. Everything that reaches it
 * has already been filtered by `domProps.ts`'s allowlist.
 */
import { createElement, type ComponentProps, type ReactElement } from "react";

import type { PropBag } from "./domProps";

export function createHostElement(
  element: string,
  props: PropBag,
): ReactElement {
  return createElement(
    element as "div",
    props as unknown as ComponentProps<"div">,
  );
}
