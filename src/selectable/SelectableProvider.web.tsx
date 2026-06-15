import { useCallback, useEffect, useState } from "react";

import { SelectableSelectionContext } from "./selectableContextValue";
import {
  selectableSelectionFromSelection,
  selectableSelectionsEqual,
} from "./selectableModel";
import {
  DEFAULT_SELECTABLE_SELECTOR,
  emptySelectableSelection,
  type SelectableProviderProps,
  type SelectableRoot,
  type SelectableSelection,
} from "./selectableTypes";

export function SelectableProvider({
  children,
  disabled = false,
  getElementId,
  onChange,
  root,
  rootRef,
  selector = DEFAULT_SELECTABLE_SELECTOR,
}: SelectableProviderProps) {
  const [selection, setSelection] = useState<SelectableSelection>(
    emptySelectableSelection,
  );

  const readSelection = useCallback(() => {
    if (disabled || typeof document === "undefined") {
      return emptySelectableSelection;
    }

    const selectionRoot = resolveRoot(root, rootRef?.current);
    const ownerDocument = resolveOwnerDocument(selectionRoot);
    const selectionSource =
      ownerDocument.getSelection?.() ?? window.getSelection?.() ?? null;

    return selectableSelectionFromSelection({
      getElementId,
      root: selectionRoot,
      selection: selectionSource,
      selector,
    });
  }, [disabled, getElementId, root, rootRef, selector]);

  const updateSelection = useCallback(() => {
    const nextSelection = readSelection();
    setSelection((currentSelection) =>
      selectableSelectionsEqual(currentSelection, nextSelection)
        ? currentSelection
        : nextSelection,
    );
  }, [readSelection]);

  useEffect(() => {
    updateSelection();
  }, [updateSelection]);

  useEffect(() => {
    onChange?.(selection);
  }, [onChange, selection]);

  useEffect(() => {
    if (disabled || typeof document === "undefined") {
      return undefined;
    }

    const selectionRoot = resolveRoot(root, rootRef?.current);
    const ownerDocument = resolveOwnerDocument(selectionRoot);
    ownerDocument.addEventListener("selectionchange", updateSelection);
    ownerDocument.defaultView?.addEventListener("mouseup", updateSelection);
    ownerDocument.defaultView?.addEventListener("keyup", updateSelection);

    return () => {
      ownerDocument.removeEventListener("selectionchange", updateSelection);
      ownerDocument.defaultView?.removeEventListener(
        "mouseup",
        updateSelection,
      );
      ownerDocument.defaultView?.removeEventListener("keyup", updateSelection);
    };
  }, [disabled, root, rootRef, updateSelection]);

  return (
    <SelectableSelectionContext.Provider value={selection}>
      {children}
    </SelectableSelectionContext.Provider>
  );
}

function resolveRoot(
  root: SelectableRoot | null | undefined,
  refRoot: SelectableRoot | null | undefined,
): SelectableRoot {
  return root ?? refRoot ?? document;
}

function resolveOwnerDocument(root: SelectableRoot): Document {
  return "defaultView" in root ? root : (root.ownerDocument ?? document);
}
