import { useEffect } from "react";

import { SelectableSelectionContext } from "./selectableContext";
import {
  emptySelectableSelection,
  type SelectableProviderProps,
} from "./selectableTypes";

export function SelectableProvider({
  children,
  onChange,
}: SelectableProviderProps) {
  useEffect(() => {
    onChange?.(emptySelectableSelection);
  }, [onChange]);

  return (
    <SelectableSelectionContext.Provider value={emptySelectableSelection}>
      {children}
    </SelectableSelectionContext.Provider>
  );
}
