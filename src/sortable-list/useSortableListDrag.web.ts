/**
 * Web drag-and-drop for a lone {@link SortableList} — the single-list face of
 * the shared {@link useSortableDrag} engine. The engine reasons about N groups;
 * a list on its own is simply a coordinator of one, so this adapter registers a
 * single implicit group, unwraps the engine's `{ groupId, index }` target back
 * to a bare `{ index }`, and drops the group ids from each committed move
 * before handing it to `onReorder`.
 *
 * Keeping one engine — rather than a second copy for the grouped case — is what
 * stops the two drifting; everything a lone list does (the lifted clone, the
 * dashed preview, the keyboard grab, the announcements) is the engine's
 * behaviour with one group and no group name.
 */
import { useCallback, useMemo } from "react";

import { useSortableDrag } from "./useSortableDrag.web";
import type { SortableDragState } from "./sortableListModel";
import type {
  SortableDragOptions,
  UseSortableListDrag,
} from "./sortableListTypes";

/**
 * The group id a lone list registers under. It never reaches a consumer — the
 * adapter strips it from every move — so its value only has to be stable.
 */
const IMPLICIT_GROUP_ID = "sortable-list";

export function useSortableListDrag(
  options: SortableDragOptions,
): UseSortableListDrag {
  const { enabled, handle, keys, label, onReorder, orientation } = options;

  // No `label`: an unnamed group makes the engine announce the bare
  // `Position 2 of 5`, exactly as a lone list should.
  const groups = useMemo(
    () => [{ groupId: IMPLICIT_GROUP_ID, handle, keys, orientation }],
    [handle, keys, orientation],
  );

  const onMove = useCallback(
    (move: { key: string; fromIndex: number; toIndex: number }) =>
      onReorder?.({
        fromIndex: move.fromIndex,
        key: move.key,
        toIndex: move.toIndex,
      }),
    [onReorder],
  );

  const drag = useSortableDrag({ enabled, groups, label, onMove });

  const dragState: SortableDragState = useMemo(
    () => ({
      ...drag.dragState,
      target: drag.dragState.target
        ? { index: drag.dragState.target.index }
        : null,
    }),
    [drag.dragState],
  );

  return {
    bindGhost: drag.bindGhost,
    bindList: drag.bindList(IMPLICIT_GROUP_ID),
    dragState,
    itemBinding: drag.itemBinding,
  };
}
