/** Pure ordering, focus candidates, and page membership for web dialogs. */

/** An open layer and the element that had focus when it opened. */
export type WebModalStackEntry<L, E> = {
  readonly layer: L;
  readonly opener: E | null;
};

/** Stack order runs from the bottom layer to the top layer. */
export type WebModalStackState<L, E> = {
  readonly entries: readonly WebModalStackEntry<L, E>[];
  readonly pageNodes: ReadonlyMap<E, ReadonlySet<L>>;
};

/** Page ownership changes only when the stack becomes occupied or empty. */
export type WebModalPageLock = "lock" | "unlock" | null;

/** Push results distinguish a duplicate from a new layer inserted below top. */
export type WebModalStackPush<L, E> = {
  readonly state: WebModalStackState<L, E>;
  readonly inserted: boolean;
  readonly isTop: boolean;
  readonly newlyMarked: readonly E[];
  readonly pageLock: WebModalPageLock;
};

/** Removal keeps the old entry for ordered focus restoration. */
export type WebModalStackRemoval<L, E> = {
  readonly state: WebModalStackState<L, E>;
  readonly removed: WebModalStackEntry<L, E> | null;
  readonly wasTop: boolean;
  readonly released: readonly E[];
  readonly pageLock: WebModalPageLock;
};

/** The DOM side tries each candidate and skips unusable elements. */
export type WebModalFocusCandidate<L, E> =
  | { readonly kind: "element"; readonly element: E }
  | { readonly kind: "layer"; readonly layer: L };

/** Creates an empty stack without any page ownership. */
export function createWebModalStackState<L, E>(): WebModalStackState<L, E> {
  return { entries: [], pageNodes: new Map() };
}

/** The only layer that receives input, or null when the stack is empty. */
export function webModalStackTop<L, E>(
  state: WebModalStackState<L, E>,
): WebModalStackEntry<L, E> | null {
  return state.entries.at(-1) ?? null;
}

/** All layers below the top, in their existing stack order. */
export function webModalStackBelow<L, E>(
  state: WebModalStackState<L, E>,
): readonly WebModalStackEntry<L, E>[] {
  return state.entries.slice(0, -1);
}

function descendsFrom<L extends { readonly parent: L | null }>(
  layer: L,
  ancestor: L,
): boolean {
  for (let parent = layer.parent; parent; parent = parent.parent) {
    if (parent === ancestor) {
      return true;
    }
  }
  return false;
}

/** Inserts below an open descendant, otherwise on top; duplicates do nothing. */
export function pushWebModalStack<L extends { readonly parent: L | null }, E>(
  state: WebModalStackState<L, E>,
  layer: L,
  opener: E | null,
  currentPageNodes: readonly E[],
): WebModalStackPush<L, E> {
  if (state.entries.some((entry) => entry.layer === layer)) {
    return {
      state,
      inserted: false,
      isTop: false,
      newlyMarked: [],
      pageLock: null,
    };
  }
  const entries = [...state.entries];
  const descendantIndex = entries.findIndex((entry) =>
    descendsFrom(entry.layer, layer),
  );
  if (descendantIndex === -1) {
    entries.push({ layer, opener });
  } else {
    const descendant = entries[descendantIndex];
    entries[descendantIndex] = { ...descendant, opener: null };
    entries.splice(descendantIndex, 0, { layer, opener: descendant.opener });
  }
  const pageNodes = new Map(state.pageNodes);
  const newlyMarked: E[] = [];
  for (const node of currentPageNodes) {
    const members = pageNodes.get(node);
    if (!members?.size) {
      newlyMarked.push(node);
    }
    pageNodes.set(node, new Set([...(members ?? []), layer]));
  }
  return {
    state: { entries, pageNodes },
    inserted: true,
    isTop: descendantIndex === -1,
    newlyMarked,
    pageLock: state.entries.length === 0 ? "lock" : null,
  };
}

/** Removes one layer and passes its opener to the entry directly above it. */
export function removeWebModalStack<L, E>(
  state: WebModalStackState<L, E>,
  layer: L,
  isInside: (element: E, layer: L) => boolean,
): WebModalStackRemoval<L, E> {
  const index = state.entries.findIndex((entry) => entry.layer === layer);
  if (index === -1) {
    return {
      state,
      removed: null,
      wasTop: false,
      released: [],
      pageLock: null,
    };
  }
  const entries = [...state.entries];
  const [removed] = entries.splice(index, 1);
  const above = entries[index];
  if (above && (above.opener === null || isInside(above.opener, layer))) {
    entries[index] = { ...above, opener: removed.opener };
  }
  const pageNodes = new Map(state.pageNodes);
  const released: E[] = [];
  for (const [node, members] of state.pageNodes) {
    if (!members.has(layer)) {
      continue;
    }
    const remaining = new Set(members);
    remaining.delete(layer);
    if (remaining.size === 0) {
      pageNodes.delete(node);
      released.push(node);
    } else {
      pageNodes.set(node, remaining);
    }
  }
  return {
    state: { entries, pageNodes },
    removed,
    wasTop: index === state.entries.length - 1,
    released,
    pageLock: entries.length === 0 ? "unlock" : null,
  };
}

/** Closing top tries its opener, then the new top; other removals do not focus. */
export function webModalRestoreCandidates<L, E>(
  removal: WebModalStackRemoval<L, E>,
): WebModalFocusCandidate<L, E>[] {
  if (!removal.wasTop || !removal.removed) {
    return [];
  }
  const candidates: WebModalFocusCandidate<L, E>[] = [];
  if (removal.removed.opener !== null) {
    candidates.push({ kind: "element", element: removal.removed.opener });
  }
  const top = webModalStackTop(removal.state);
  if (top) {
    candidates.push({ kind: "layer", layer: top.layer });
  }
  return candidates;
}

/** A root to move immediately before another root in the same container. */
export type WebModalRootMove<E> = { readonly root: E; readonly before: E };

/** Orders registered roots from the top down without ever moving the top root. */
export function webModalRootMoves<E>(
  stackOrder: readonly E[],
  currentOrder: readonly E[],
): WebModalRootMove<E>[] {
  const order = [...currentOrder];
  const moves: WebModalRootMove<E>[] = [];
  for (let index = stackOrder.length - 2; index >= 0; index -= 1) {
    const root = stackOrder[index];
    const before = stackOrder[index + 1];
    const currentIndex = order.indexOf(root);
    if (currentIndex >= 0 && currentIndex + 1 === order.indexOf(before)) {
      continue;
    }
    if (currentIndex >= 0) {
      order.splice(currentIndex, 1);
    }
    order.splice(order.indexOf(before), 0, root);
    moves.push({ root, before });
  }
  return moves;
}
