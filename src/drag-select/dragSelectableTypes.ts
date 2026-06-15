/** Public types for drag-selectable target state and subscriptions. */
import type { ReactNode } from "react";
import type { StyleProp, View, ViewStyle } from "react-native";

import type { DragSelectableBox } from "./dragSelectableModel";

export type DragSelectableTargetSnapshot = {
  data?: unknown;
  id: string;
};

export type DragSelectableSelection = {
  selectedCount: number;
  selectedIds: string[];
  selectedTargets: DragSelectableTargetSnapshot[];
};

export type DragSelectableSelectionLabelContext = {
  matchingCount: number;
  matchingIds: string[];
  matchingTargets: DragSelectableTargetSnapshot[];
};

export type DragSelectableSelectionLabel = (
  count: number,
  context: DragSelectableSelectionLabelContext,
) => string;

export type DragSelectableState = DragSelectableSelection & {
  dragBox: DragSelectableBox | null;
  dragging: boolean;
  matchingCount: number;
  matchingIds: string[];
  matchingTargets: DragSelectableTargetSnapshot[];
};

export type DragSelectableChangeListener = (state: DragSelectableState) => void;

export type DragSelectableProviderProps = {
  children: ReactNode;
  disabled?: boolean;
  onSelectionChange?: (selection: DragSelectableSelection) => void;
  overlayZIndex?: number;
  selectionLabel?: DragSelectableSelectionLabel;
  style?: StyleProp<ViewStyle>;
};

export type DragSelectableTargetOptions = {
  data?: unknown;
  disabled?: boolean;
  id: string;
};

export type DragSelectableTargetResult = {
  dragging: boolean;
  matching: boolean;
  ref: (node: View | null) => void;
  selected: boolean;
};

export type DragSelectableTargetRegistration = DragSelectableTargetOptions & {
  node: View;
};
