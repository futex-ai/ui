/**
 * The phone menu sheet: the menu rows in the shared {@link Sheet}, on web and
 * native. `InlineMenu` and `ResponsiveMenu` open it on a touch surface, and
 * `InlineMenu` on native.
 *
 * - It marks its own touch surface, so the rows and the close control are
 *   44px targets whatever the size.
 * - It opens without an active row. The arrow keys still move the active row.
 * - The keys stay on the menu list, which holds focus. No document listener
 *   takes Enter or Space, so the sheet's close control and any other header
 *   action still work by keyboard.
 * - The sheet keeps the modal behaviour: the focus trap, Escape, the backdrop,
 *   Android back, and focus return to the trigger.
 */
import { useId, useState } from "react";
import type { ReactNode } from "react";

import type { ControlSize } from "../controlSize";
import { DropdownList } from "../dropdown";
import type { DropdownHighlightVariant, DropdownListEntry } from "../dropdown";
import { Sheet } from "../sheet";
import { TouchSurface } from "../touchSurface";

export type MenuSheetProps = {
  /** Controlled active row; omit it to start each open without one. */
  activeId?: string | null;
  dismissLabel?: string;
  /** Rows, already wrapped to close the menu after a selection. */
  entries: DropdownListEntry[];
  footer?: ReactNode;
  header?: ReactNode;
  /** Hide the close control. Escape, the backdrop, and back still close. */
  hideHeader?: boolean;
  highlightVariant?: DropdownHighlightVariant;
  label: string;
  maxHeight?: number;
  onActiveIdChange?: (id: string | null) => void;
  onClose: () => void;
  open: boolean;
  search?: ReactNode;
  /** The row size whose title weight the touch rows keep. */
  size?: ControlSize;
  testID?: string;
  title?: string;
};

export function MenuSheet({
  dismissLabel,
  hideHeader,
  label,
  maxHeight,
  onClose,
  open,
  testID,
  title,
  ...listProps
}: MenuSheetProps) {
  return (
    <TouchSurface>
      <Sheet
        dismissLabel={dismissLabel}
        hideHeader={hideHeader}
        label={label}
        maxHeight={maxHeight}
        onClose={onClose}
        open={open}
        testID={testID}
        title={title}
      >
        {({ close, maxHeight: bodyMaxHeight }) => (
          <MenuSheetList
            {...listProps}
            label={label}
            maxHeight={bodyMaxHeight}
            onClose={close}
          />
        )}
      </Sheet>
    </TouchSurface>
  );
}

type MenuSheetListProps = Pick<
  MenuSheetProps,
  | "activeId"
  | "entries"
  | "footer"
  | "header"
  | "highlightVariant"
  | "label"
  | "onActiveIdChange"
  | "search"
  | "size"
> & { maxHeight: number; onClose: () => void };

/**
 * The rows of the sheet. The sheet mounts its body only while it is open, so
 * the own active row starts empty on every open.
 */
function MenuSheetList({
  activeId,
  onActiveIdChange,
  ...props
}: MenuSheetListProps) {
  const listId = useId();
  const [ownActiveId, setOwnActiveId] = useState<string | null>(null);
  return (
    <DropdownList
      {...props}
      activeId={activeId === undefined ? ownActiveId : activeId}
      focusMode="list"
      listId={listId}
      listRole="menu"
      onActiveIdChange={(id) => {
        setOwnActiveId(id);
        onActiveIdChange?.(id);
      }}
    />
  );
}
