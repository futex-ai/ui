/** Shared DOM ownership, Tab containment, and focus restoration for web modals. */
import { LIVE_OVERLAY_ATTRIBUTE } from "../liveOverlay";

import type { Focusable } from "./types";
import { focusWebModalElement, trapWebModalFocus } from "./webModalFocusTrap";
import type { WebModalCloseSource } from "./webModalModel";
import { getWebModalRoot } from "./webModalRoot";
import { lockPageScroll, unlockPageScroll } from "./webModalScrollLock";
import {
  createWebModalStackState,
  pushWebModalStack,
  removeWebModalStack,
  webModalRestoreCandidates,
  webModalRootMoves,
  webModalStackTop,
} from "./webModalStackModel";

/** Internal frame boundary; getters read current refs while the frame is open. */
export type WebModalLayer = {
  /** The nearest containing frame, including one whose effect has not run yet. */
  readonly parent: WebModalLayer | null;
  /** The frame's direct child of the shared root, captured once on push. */
  readonly root: () => HTMLElement | null;
  /** The dialog surface used by the single Tab trap. */
  readonly surface: () => HTMLElement | null;
  /** Resolves the caller's explicit target or the frame's default target. */
  readonly initialFocusTarget: () => Focusable | null;
  /** Applies the frame's close policy to the requested source. */
  readonly requestClose: (source: WebModalCloseSource) => void;
};

type PageNodeState = {
  inert: string | null;
  ariaHidden: string | null;
};

let stack = createWebModalStackState<WebModalLayer, HTMLElement>();
const layerRoots = new Map<WebModalLayer, HTMLElement | null>();
const priorPageState = new Map<HTMLElement, PageNodeState>();

/** Registers a frame in tree order and focuses it only if it becomes top. */
export function pushWebModalLayer(layer: WebModalLayer): void {
  if (typeof document === "undefined") {
    return;
  }
  // Inert can blur the opener to body, so capture it before marking the page.
  const activeElement = document.activeElement;
  const opener =
    activeElement instanceof HTMLElement &&
    activeElement !== document.body &&
    activeElement !== document.documentElement
      ? activeElement
      : null;
  const pushed = pushWebModalStack(stack, layer, opener, currentPageNodes());
  if (!pushed.inserted) {
    return;
  }
  stack = pushed.state;
  layerRoots.set(layer, layer.root());
  for (const node of pushed.newlyMarked) {
    priorPageState.set(node, {
      inert: node.getAttribute("inert"),
      ariaHidden: node.getAttribute("aria-hidden"),
    });
    node.setAttribute("inert", "");
    node.setAttribute("aria-hidden", "true");
  }
  applyLayerRoots();
  if (pushed.pageLock === "lock") {
    document.addEventListener("keydown", handleKeyDown, true);
    lockPageScroll();
  }
  if (pushed.isTop) {
    focusWebModalElement(layer.initialFocusTarget());
  }
}

/** Restores released page nodes before returning focus from a removed top. */
export function removeWebModalLayer(layer: WebModalLayer): void {
  if (typeof document === "undefined") {
    return;
  }
  const removal = removeWebModalStack(
    stack,
    layer,
    (element, removedLayer) =>
      layerRoots.get(removedLayer)?.contains(element) ?? false,
  );
  if (!removal.removed) {
    return;
  }
  stack = removal.state;
  layerRoots.delete(layer);
  for (const node of removal.released) {
    restorePageNode(node);
  }
  applyLayerRoots();
  if (removal.pageLock === "unlock") {
    document.removeEventListener("keydown", handleKeyDown, true);
    unlockPageScroll();
  }
  for (const candidate of webModalRestoreCandidates(removal)) {
    if (candidate.kind === "element") {
      if (tryRestoreElement(candidate.element)) {
        return;
      }
    } else {
      focusWebModalElement(candidate.layer.initialFocusTarget());
      return;
    }
  }
}

/** The active frame for Escape routing, or null when no frame is registered. */
export function topWebModalLayer(): WebModalLayer | null {
  return webModalStackTop(stack)?.layer ?? null;
}

function currentPageNodes(): HTMLElement[] {
  const root = getWebModalRoot();
  return Array.from(document.body.children).filter(
    (node): node is HTMLElement =>
      node instanceof HTMLElement &&
      node !== root &&
      !node.hasAttribute(LIVE_OVERLAY_ATTRIBUTE),
  );
}

function restorePageNode(node: HTMLElement): void {
  const prior = priorPageState.get(node);
  if (!prior) {
    return;
  }
  restoreAttribute(node, "inert", prior.inert);
  restoreAttribute(node, "aria-hidden", prior.ariaHidden);
  priorPageState.delete(node);
}

function restoreAttribute(
  node: HTMLElement,
  attribute: string,
  value: string | null,
): void {
  if (value === null) {
    node.removeAttribute(attribute);
  } else {
    node.setAttribute(attribute, value);
  }
}

function applyLayerRoots(): void {
  const top = topWebModalLayer();
  const container = getWebModalRoot();
  const roots: HTMLElement[] = [];
  for (const { layer } of stack.entries) {
    const root = layerRoots.get(layer);
    if (!root) {
      continue;
    }
    if (layer === top) {
      root.removeAttribute("inert");
      root.removeAttribute("aria-hidden");
    } else {
      root.setAttribute("inert", "");
      root.setAttribute("aria-hidden", "true");
    }
    if (root.parentElement === container) {
      roots.push(root);
    }
  }
  if (!container) {
    return;
  }
  const currentOrder = Array.from(container.children).filter(
    (node): node is HTMLElement =>
      node instanceof HTMLElement && roots.includes(node),
  );
  for (const { root, before } of webModalRootMoves(roots, currentOrder)) {
    container.insertBefore(root, before);
  }
}

function tryRestoreElement(element: HTMLElement): boolean {
  if (!element.isConnected || element.closest("[inert]")) {
    return false;
  }
  focusWebModalElement(element);
  return document.activeElement === element;
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === "Tab") {
    trapWebModalFocus(event, topWebModalLayer()?.surface() ?? null);
  }
}
