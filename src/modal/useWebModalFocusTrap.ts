/**
 * The web modal frame's focus and dismissal effects while it is open: the
 * inert background, the initial focus and its restore on close, Escape through
 * the shared escape-layer stack, and the Tab trap.
 */
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { View } from "../primitives/reactNative";

import { pushEscapeLayer, removeEscapeLayer } from "../escapeLayer";
import { LIVE_REGION_ATTRIBUTE } from "../liveRegion";

import type { Focusable } from "./types";
import {
  focusWebModalElement,
  trapWebModalFocus,
  webModalInitialFocusTarget,
  webModalPortalRoot,
} from "./webModalFocus";
import type { WebModalCloseSource } from "./webModalModel";

export function useWebModalFocusTrap({
  closeButtonRef,
  initialFocusTargetRef,
  requestClose,
  surfaceRef,
  visible,
}: {
  closeButtonRef: RefObject<View | null>;
  /** The latest `initialFocusRef` prop, read when the modal opens. */
  initialFocusTargetRef: RefObject<RefObject<Focusable | null> | undefined>;
  requestClose: (source: WebModalCloseSource) => void;
  surfaceRef: RefObject<View | null>;
  visible: boolean;
}) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // RNW does not emit `inert`/`aria-hidden` for `accessibilityViewIsModal`, so
  // the background stays in the AT tree and tab order. Imperatively mark every
  // sibling of the modal's portal root inert while the modal is open, then
  // restore each node's prior state on close. `inert` also removes the
  // background from sequential focus, reinforcing the JS focus trap below.
  // The library's live regions stay exposed, so the modal's own status
  // messages, such as a result count, still reach screen readers.
  //
  // This effect is declared *before* the focus-restore effect on purpose: React
  // runs cleanups in declaration order, so the background is un-inerted here
  // first, before the focus effect's cleanup tries to restore focus to a
  // previously-focused background element (focusing an `inert` node is a no-op).
  useEffect(() => {
    if (!visible || typeof document === "undefined") {
      return;
    }
    // Capture the trigger element here, before `inert` is applied below — marking
    // its container inert blurs it to `<body>`, so we must snapshot it first so
    // focus can be restored to it on close.
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const surface = surfaceRef.current as unknown;
    const root =
      surface instanceof HTMLElement ? webModalPortalRoot(surface) : null;
    const body = document.body;
    const siblings = Array.from(body.children).filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement &&
        node !== root &&
        !node.hasAttribute(LIVE_REGION_ATTRIBUTE),
    );
    const restorers = siblings.map((node) => {
      const hadInert = node.hasAttribute("inert");
      const prevAriaHidden = node.getAttribute("aria-hidden");
      node.setAttribute("inert", "");
      node.setAttribute("aria-hidden", "true");
      return () => {
        if (!hadInert) {
          node.removeAttribute("inert");
        }
        if (prevAriaHidden === null) {
          node.removeAttribute("aria-hidden");
        } else {
          node.setAttribute("aria-hidden", prevAriaHidden);
        }
      };
    });
    return () => {
      for (const restore of restorers) {
        restore();
      }
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || typeof document === "undefined") {
      return;
    }
    // The trigger to restore on close is captured by the inertness effect above
    // (which runs first, before `inert` blurs it). The portal children are
    // committed before this effect runs, so the DOM is queryable and focus can
    // move into the surface synchronously (no `setTimeout(0)` race).
    focusWebModalElement(
      initialFocusTargetRef.current?.current ??
        webModalInitialFocusTarget(surfaceRef, closeButtonRef),
    );
    return () => {
      focusWebModalElement(previousFocusRef.current);
      previousFocusRef.current = null;
    };
  }, [visible]);

  // Escape goes through the shared escape-layer stack rather than this modal's
  // own keydown listener, so a dropdown, popover, or nested modal opened above
  // this surface consumes Escape first and this modal stays open. Only the
  // top-most layer closes; see escapeLayer.ts.
  useEffect(() => {
    if (!visible || typeof document === "undefined") {
      return;
    }
    const layer = { onEscape: () => requestClose("escape") };
    pushEscapeLayer(layer);
    return () => {
      removeEscapeLayer(layer);
    };
  }, [requestClose, visible]);

  useEffect(() => {
    if (!visible || typeof document === "undefined") {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      // Trap on every Tab while the modal is visible — not only when focus is
      // already inside the surface — so focus that escaped to <body> (e.g. after
      // a click on the inert backdrop) is pulled back in on the next Tab. The
      // trap helper already handles the focus-outside case, and it leaves Tab
      // to the top modal when another modal covers this one.
      if (event.key === "Tab") {
        trapWebModalFocus(event, surfaceRef);
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [visible]);
}
