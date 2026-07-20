/** Web slash-menu surface for the RichTextEditor. */
import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Pilcrow,
  TextQuote,
} from "lucide-react-native";
import { useEffect, useMemo } from "react";
import type { RefObject } from "react";
import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import {
  DropdownIconBox,
  DropdownList,
  dropdownPlacement,
  dropdownSurfaceRect,
  useDropdownSurfaceStyles,
} from "../dropdown";
import type { DropdownListEntry } from "../dropdown";
import { DropdownWebLayer } from "../dropdown/DropdownWebLayer";

import type {
  BuiltInSlashMenuIcon,
  SlashMenuModelItem,
  SlashMenuSection,
} from "./slashMenuModel";
import { useCaretAnchor } from "./useCaretAnchor.web";

type SlashMenuProps = {
  activeId: string | null;
  listId: string;
  onActiveIdChange: (id: string | null) => void;
  onClose: () => void;
  onSelect: (item: SlashMenuModelItem) => void;
  open: boolean;
  rootRef: RefObject<HTMLElement | null>;
  sections: readonly SlashMenuSection[];
  surfaceRef: RefObject<View | null>;
};

const BUILTIN_ICONS: Record<BuiltInSlashMenuIcon, LucideIcon> = {
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Pilcrow,
  TextQuote,
};

/** Slash-command dropdown anchored to the current editor caret. */
export function SlashMenu({
  activeId,
  listId,
  onActiveIdChange,
  onClose,
  onSelect,
  open,
  rootRef,
  sections,
  surfaceRef,
}: SlashMenuProps) {
  const { anchor, viewport } = useCaretAnchor(rootRef, open);
  const surfaceStyles = useDropdownSurfaceStyles();
  const entries = useMemo(() => menuEntries(sections), [sections]);
  const itemById = useMemo(() => {
    const lookup = new Map<string, SlashMenuModelItem>();
    for (const section of sections) {
      for (const item of section.items) {
        lookup.set(item.id, item);
      }
    }
    return lookup;
  }, [sections]);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const targetElement = eventTargetElement(event.target);
      const surface = targetElement?.closest<HTMLElement>(
        '[data-testid="rich-text-slash-menu"]',
      );
      if (!surface || isScrollbarPointer(event, targetElement)) {
        return;
      }
      event.preventDefault();
      const target = targetElement?.closest<HTMLElement>(
        '[data-testid^="rich-text-slash-item-"]',
      );
      const testID = target?.getAttribute("data-testid") ?? "";
      const item = itemById.get(testID.slice("rich-text-slash-item-".length));
      if (!item) {
        return;
      }
      event.stopPropagation();
      onSelect(item);
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [itemById, onSelect, open]);

  if (!open || !anchor) {
    return null;
  }

  const placement = dropdownPlacement(anchor, viewport, {
    align: "start",
    maxHeight: 280,
    minHeight: 120,
    minWidth: 260,
  });

  return (
    <DropdownWebLayer>
      <View
        ref={surfaceRef}
        style={[surfaceStyles.surface, dropdownSurfaceRect(placement)]}
        testID="rich-text-slash-menu"
      >
        <DropdownList
          activeId={activeId}
          entries={entries}
          label="Rich text commands"
          listId={listId}
          maxHeight={placement.maxHeight}
          onActiveIdChange={onActiveIdChange}
          onClose={onClose}
        />
      </View>
    </DropdownWebLayer>
  );
}

function menuEntries(
  sections: readonly SlashMenuSection[],
): DropdownListEntry[] {
  if (sections.length === 0) {
    return [
      {
        disabled: true,
        id: "no-results",
        label: "No results",
        type: "item",
      },
    ];
  }
  return sections.flatMap((section, index) => [
    {
      id: `section:${index}:${section.title}`,
      label: section.title,
      type: "section",
    },
    ...section.items.map((item) => ({
      id: item.id,
      label: item.label,
      leading: <SlashMenuIcon item={item} />,
      rightText: item.source === "builtIn" ? item.rightText : undefined,
      testID: `rich-text-slash-item-${item.id}`,
      type: "item" as const,
    })),
  ]);
}

function SlashMenuIcon({ item }: { item: SlashMenuModelItem }) {
  const Icon =
    item.source === "builtIn" ? BUILTIN_ICONS[item.icon] : extraIcon(item.icon);
  return Icon ? <DropdownIconBox Icon={Icon} /> : null;
}

function extraIcon(icon: unknown): LucideIcon | null {
  return typeof icon === "function" ||
    (typeof icon === "object" && icon !== null)
    ? (icon as LucideIcon)
    : null;
}

function eventTargetElement(target: EventTarget | null): Element | null {
  if (target instanceof Element) {
    return target;
  }
  return target instanceof Node ? target.parentElement : null;
}

function isScrollbarPointer(
  event: PointerEvent,
  target: Element | null,
): boolean {
  const scroller = target?.closest<HTMLElement>('[role="listbox"]');
  if (!scroller || scroller.scrollHeight <= scroller.clientHeight) {
    return false;
  }
  const scrollbarWidth = scroller.offsetWidth - scroller.clientWidth;
  if (scrollbarWidth <= 0) {
    return false;
  }
  const rect = scroller.getBoundingClientRect();
  return (
    event.clientX >= rect.right - scrollbarWidth &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
}
