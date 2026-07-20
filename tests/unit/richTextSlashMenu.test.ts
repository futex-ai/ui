import assert from "node:assert/strict";
import test from "node:test";

import {
  filterSlashMenuSections,
  slashMenuItemsFromSections,
  slashMenuSections,
} from "../../src/rich-text/slashMenuModel";
import type { SlashMenuItem } from "../../src/rich-text/richTextTypes";

test("built-in slash menu sections keep the specified order", () => {
  const sections = slashMenuSections();

  assert.deepEqual(
    sections.map((section) => section.title),
    ["Text", "Lists", "Blocks"],
  );
  assert.deepEqual(
    sections.map((section) => section.items.map((item) => item.label)),
    [
      ["Text", "Heading 1", "Heading 2", "Heading 3"],
      ["Bulleted list", "Numbered list", "Checklist"],
      ["Quote", "Code block", "Divider"],
    ],
  );
});

test("filters slash menu items case-insensitively by label", () => {
  const sections = filterSlashMenuSections("HEADING");

  assert.deepEqual(
    sections.map((section) => ({
      items: section.items.map((item) => item.id),
      title: section.title,
    })),
    [{ items: ["heading1", "heading2", "heading3"], title: "Text" }],
  );
});

test("filters slash menu items by keywords", () => {
  const sections = filterSlashMenuSections("todo");
  const items = slashMenuItemsFromSections(sections);

  assert.deepEqual(
    items.map((item) => item.label),
    ["Checklist"],
  );
});

test("returns no sections when a query has zero matches", () => {
  assert.deepEqual(filterSlashMenuSections("zzzz"), []);
});

test("groups extra slash menu items by section with default actions", () => {
  const extraItems: SlashMenuItem[] = [
    {
      execute: () => undefined,
      id: "summary",
      keywords: ["brief"],
      label: "Summary",
      section: "AI",
    },
    {
      execute: () => undefined,
      id: "stamp",
      label: "Timestamp",
    },
    {
      execute: () => undefined,
      id: "draft",
      label: "Draft reply",
      section: "AI",
    },
  ];

  const sections = slashMenuSections(extraItems).slice(3);

  assert.deepEqual(
    sections.map((section) => ({
      ids: section.items.map((item) => item.id),
      title: section.title,
    })),
    [
      { ids: ["extra:summary", "extra:draft"], title: "AI" },
      { ids: ["extra:stamp"], title: "Actions" },
    ],
  );
});

test("filters extra slash menu items by label and keywords", () => {
  const extraItems: SlashMenuItem[] = [
    {
      execute: () => undefined,
      id: "summary",
      keywords: ["brief"],
      label: "Summary",
      section: "AI",
    },
  ];

  const sections = filterSlashMenuSections("brief", extraItems);

  assert.deepEqual(
    sections.map((section) => ({
      labels: section.items.map((item) => item.label),
      title: section.title,
    })),
    [{ labels: ["Summary"], title: "AI" }],
  );
});
