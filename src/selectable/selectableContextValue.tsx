import { createContext } from "react";

import {
  emptySelectableSelection,
  type SelectableSelection,
} from "./selectableTypes";

export const SelectableSelectionContext = createContext<SelectableSelection>(
  emptySelectableSelection,
);
