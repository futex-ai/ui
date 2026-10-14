/**
 * A fake environment for `startDragSelectableSession`: it records every side
 * effect, so the session tests count operations instead of reading a DOM.
 */
import type { DragSelectableMeasuredTarget } from "../../src/drag-select/dragSelectableDom";
import type { DragSelectableAnchorFrame } from "../../src/drag-select/dragSelectableScrollAnchor";
import type {
  DragSelectableActiveDrag,
  DragSelectableSessionEnv,
  DragSelectableSessionHandlers,
} from "../../src/drag-select/dragSelectableSession";

/** Ten 50px rows, `row_1` to `row_10`, stacked from the top of the viewport. */
export function stackedRows(offsetTop = 0): DragSelectableMeasuredTarget[] {
  return Array.from({ length: 10 }, (_, index) => ({
    bottom: offsetTop + (index + 1) * 50,
    id: `row_${index + 1}`,
    left: 100,
    right: 500,
    top: offsetTop + index * 50,
  }));
}

export type FakeSessionEnv = ReturnType<typeof fakeSessionEnv>;

/** Builds the fake environment and the counters it fills. */
export function fakeSessionEnv() {
  const calls = {
    commits: [] as string[][],
    endedPresses: [] as Array<number | undefined>,
    ends: 0,
    escapes: [] as Array<() => void>,
    measures: 0,
    orderedMeasures: 0,
    removedEscapes: 0,
    removedListeners: 0,
    renders: [] as Array<DragSelectableActiveDrag | null>,
    suppressedClicks: 0,
    textBlocks: 0,
    textRestores: 0,
  };
  let handlers: DragSelectableSessionHandlers | null = null;
  let anchor: DragSelectableAnchorFrame = {
    left: 0,
    scrollLeft: 0,
    scrollTop: 0,
    top: 0,
  };
  let targets = stackedRows();
  const env: DragSelectableSessionEnv = {
    blockTextSelection: () => {
      calls.textBlocks += 1;
      return () => {
        calls.textRestores += 1;
      };
    },
    commit: (hitIds) => {
      calls.commits.push(hitIds);
    },
    end: () => {
      calls.ends += 1;
    },
    endPresses: (pointerId) => {
      calls.endedPresses.push(pointerId);
    },
    listen: (next) => {
      handlers = next;
      return () => {
        calls.removedListeners += 1;
        handlers = null;
      };
    },
    measureTargets: () => {
      calls.measures += 1;
      return targets;
    },
    measureTargetsInOrder: () => {
      calls.orderedMeasures += 1;
      return targets;
    },
    pushEscape: (onEscape) => {
      calls.escapes.push(onEscape);
      return () => {
        calls.removedEscapes += 1;
      };
    },
    readAnchor: () => anchor,
    render: (drag) => {
      calls.renders.push(drag);
    },
    suppressClick: () => {
      calls.suppressedClicks += 1;
    },
  };
  return {
    calls,
    env,
    /** The handlers the session attached, or `null` once it stopped. */
    handlers: () => handlers,
    lastRender: () => calls.renders[calls.renders.length - 1],
    setAnchor: (next: DragSelectableAnchorFrame) => {
      anchor = next;
    },
    setTargets: (next: DragSelectableMeasuredTarget[]) => {
      targets = next;
    },
  };
}

/** The handlers of a fake environment, failing when none are attached. */
export function attached(fake: FakeSessionEnv): DragSelectableSessionHandlers {
  const handlers = fake.handlers();
  if (!handlers) {
    throw new Error("the session has no listeners attached");
  }
  return handlers;
}
