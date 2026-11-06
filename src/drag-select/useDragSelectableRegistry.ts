/** The registry of drag-select targets that a provider owns. */
import { useCallback, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";

import type {
  DragSelectableTargetOptions,
  DragSelectableTargetRegistration,
} from "./dragSelectableTypes";

/** What a provider reads from and hands down for its registered targets. */
export type DragSelectableRegistry = {
  /**
   * A snapshot that changes when a target registers or unregisters, or when
   * a target's `disabled` or `order` changes. Pure data churn does not change
   * it, so the roving tab stop is recomputed only when navigation can change.
   */
  registeredTargets: ReadonlyMap<string, DragSelectableTargetRegistration>;
  /** Whether at least one registered target is enabled. */
  hasEnabledTarget: () => boolean;
  /** Registers a target and returns the function that unregisters it. */
  registerTarget: (target: DragSelectableTargetRegistration) => () => void;
  /** The live registrations, current at call time. */
  targetsRef: MutableRefObject<Map<string, DragSelectableTargetRegistration>>;
  /** Applies new options to a registered target. */
  updateTarget: (target: DragSelectableTargetOptions) => void;
};

/**
 * Tracks registered targets by id. `onEmpty` runs when the last registered
 * target unregisters, which is how a long-lived provider in an app shell
 * notices a page change.
 */
export function useDragSelectableRegistry(
  onEmpty?: () => void,
): DragSelectableRegistry {
  const targetsRef = useRef(
    new Map<string, DragSelectableTargetRegistration>(),
  );
  const [registeredTargets, setRegisteredTargets] = useState<
    ReadonlyMap<string, DragSelectableTargetRegistration>
  >(targetsRef.current);
  const onEmptyRef = useRef(onEmpty);
  onEmptyRef.current = onEmpty;

  const publishTargets = useCallback(() => {
    setRegisteredTargets(new Map(targetsRef.current));
  }, []);

  const registerTarget = useCallback(
    (target: DragSelectableTargetRegistration) => {
      targetsRef.current.set(target.id, target);
      publishTargets();
      return () => {
        if (targetsRef.current.get(target.id)?.node !== target.node) {
          return;
        }
        targetsRef.current.delete(target.id);
        publishTargets();
        if (targetsRef.current.size === 0) {
          onEmptyRef.current?.();
        }
      };
    },
    [publishTargets],
  );

  const updateTarget = useCallback(
    (target: DragSelectableTargetOptions) => {
      const current = targetsRef.current.get(target.id);
      if (!current) {
        return;
      }
      const next = { ...current, ...target };
      if (
        current.data === next.data &&
        current.disabled === next.disabled &&
        current.label === next.label &&
        current.order === next.order
      ) {
        return;
      }
      targetsRef.current.set(target.id, next);
      if (current.disabled !== next.disabled || current.order !== next.order) {
        publishTargets();
      }
    },
    [publishTargets],
  );

  const hasEnabledTarget = useCallback(() => {
    for (const target of targetsRef.current.values()) {
      if (!target.disabled) {
        return true;
      }
    }
    return false;
  }, []);

  return useMemo(
    () => ({
      hasEnabledTarget,
      registeredTargets,
      registerTarget,
      targetsRef,
      updateTarget,
    }),
    [hasEnabledTarget, registeredTargets, registerTarget, updateTarget],
  );
}
