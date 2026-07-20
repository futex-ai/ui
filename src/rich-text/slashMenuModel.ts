/** Pure slash-menu item definitions and filtering for RichTextEditor. */
import type { RichTextTurnIntoType } from "./richTextModel";
import type { SlashMenuItem } from "./richTextTypes";

export type BuiltInSlashMenuIcon =
  | "Code"
  | "Heading1"
  | "Heading2"
  | "Heading3"
  | "List"
  | "ListChecks"
  | "ListOrdered"
  | "Minus"
  | "Pilcrow"
  | "TextQuote";

export type BuiltInSlashMenuAction =
  | { type: "divider" }
  | { blockType: RichTextTurnIntoType; type: "turnInto" };

export type SlashMenuModelItem =
  | {
      action: BuiltInSlashMenuAction;
      icon: BuiltInSlashMenuIcon;
      id: string;
      keywords: readonly string[];
      label: string;
      rightText?: string;
      section: string;
      source: "builtIn";
    }
  | {
      extra: SlashMenuItem;
      icon?: unknown;
      id: string;
      keywords: readonly string[];
      label: string;
      section: string;
      source: "extra";
    };

export type SlashMenuSection = {
  items: SlashMenuModelItem[];
  title: string;
};

const BUILTIN_SECTIONS: readonly SlashMenuSection[] = [
  {
    items: [
      builtInItem({
        blockType: "paragraph",
        icon: "Pilcrow",
        id: "paragraph",
        keywords: ["text", "body", "plain"],
        label: "Text",
        section: "Text",
      }),
      builtInItem({
        blockType: "heading1",
        icon: "Heading1",
        id: "heading1",
        keywords: ["h1", "title"],
        label: "Heading 1",
        rightText: "⌘⌥1",
        section: "Text",
      }),
      builtInItem({
        blockType: "heading2",
        icon: "Heading2",
        id: "heading2",
        keywords: ["h2", "subtitle"],
        label: "Heading 2",
        rightText: "⌘⌥2",
        section: "Text",
      }),
      builtInItem({
        blockType: "heading3",
        icon: "Heading3",
        id: "heading3",
        keywords: ["h3", "subheading"],
        label: "Heading 3",
        rightText: "⌘⌥3",
        section: "Text",
      }),
    ],
    title: "Text",
  },
  {
    items: [
      builtInItem({
        blockType: "bullet",
        icon: "List",
        id: "bullet",
        keywords: ["bulleted", "unordered", "ul"],
        label: "Bulleted list",
        rightText: "⌘⇧8",
        section: "Lists",
      }),
      builtInItem({
        blockType: "numbered",
        icon: "ListOrdered",
        id: "numbered",
        keywords: ["ordered", "ol"],
        label: "Numbered list",
        rightText: "⌘⇧9",
        section: "Lists",
      }),
      builtInItem({
        blockType: "check",
        icon: "ListChecks",
        id: "check",
        keywords: ["todo", "task", "checkbox"],
        label: "Checklist",
        rightText: "⌘⇧7",
        section: "Lists",
      }),
    ],
    title: "Lists",
  },
  {
    items: [
      builtInItem({
        blockType: "quote",
        icon: "TextQuote",
        id: "quote",
        keywords: ["blockquote", "citation"],
        label: "Quote",
        section: "Blocks",
      }),
      builtInItem({
        blockType: "codeBlock",
        icon: "Code",
        id: "codeBlock",
        keywords: ["pre", "monospace"],
        label: "Code block",
        section: "Blocks",
      }),
      {
        action: { type: "divider" },
        icon: "Minus",
        id: "divider",
        keywords: ["rule", "separator", "hr"],
        label: "Divider",
        section: "Blocks",
        source: "builtIn",
      },
    ],
    title: "Blocks",
  },
];

/** Return the complete slash-menu section model before query filtering. */
export function slashMenuSections(
  extraItems: readonly SlashMenuItem[] = [],
): SlashMenuSection[] {
  return [
    ...BUILTIN_SECTIONS.map(cloneSection),
    ...extraSections(extraItems).map(cloneSection),
  ];
}

/** Filter slash-menu items by label and keywords while preserving sections. */
export function filterSlashMenuSections(
  query: string,
  extraItems: readonly SlashMenuItem[] = [],
): SlashMenuSection[] {
  const normalized = query.trim().toLowerCase();
  const sections = slashMenuSections(extraItems);
  if (normalized.length === 0) {
    return sections;
  }
  return sections
    .map((section) => ({
      items: section.items.filter((item) => itemMatches(item, normalized)),
      title: section.title,
    }))
    .filter((section) => section.items.length > 0);
}

/** Flatten sectioned slash-menu output for keyboard navigation. */
export function slashMenuItemsFromSections(
  sections: readonly SlashMenuSection[],
): SlashMenuModelItem[] {
  return sections.flatMap((section) => section.items);
}

function builtInItem({
  blockType,
  icon,
  id,
  keywords,
  label,
  rightText,
  section,
}: {
  blockType: RichTextTurnIntoType;
  icon: BuiltInSlashMenuIcon;
  id: string;
  keywords: readonly string[];
  label: string;
  rightText?: string;
  section: string;
}): SlashMenuModelItem {
  return {
    action: { blockType, type: "turnInto" },
    icon,
    id,
    keywords,
    label,
    rightText,
    section,
    source: "builtIn",
  };
}

function cloneSection(section: SlashMenuSection): SlashMenuSection {
  return {
    items: [...section.items],
    title: section.title,
  };
}

function extraSections(
  extraItems: readonly SlashMenuItem[],
): SlashMenuSection[] {
  const sections: SlashMenuSection[] = [];
  for (const extra of extraItems) {
    const title = extra.section?.trim() || "Actions";
    const existing = sections.find((section) => section.title === title);
    const section = existing ?? { items: [], title };
    if (!existing) {
      sections.push(section);
    }
    section.items.push({
      extra,
      icon: extra.icon,
      id: `extra:${extra.id}`,
      keywords: extra.keywords ?? [],
      label: extra.label,
      section: title,
      source: "extra",
    });
  }
  return sections;
}

function itemMatches(item: SlashMenuModelItem, query: string): boolean {
  return [item.label, ...item.keywords].some((text) =>
    text.toLowerCase().includes(query),
  );
}
