/** Shared sample data for the DataGrid stories (not a Storybook story file). */
import type { DataGridColumn, DataGridRow } from "../index";

export const contentColumns: DataGridColumn[] = [
  { id: "tweet", label: "Tweet", fieldType: "text", flex: 2.4, minWidth: 220 },
  {
    id: "status",
    label: "Status",
    fieldType: "singleSelect",
    width: 130,
    options: [
      { id: "drafted", label: "Drafted", color: "amber" },
      { id: "approved", label: "Approved", color: "green" },
      { id: "duplicate", label: "Duplicate", color: "rose" },
      { id: "published", label: "Published", color: "green" },
      { id: "offbrand", label: "Off-brand", color: "rose" },
      { id: "sendfailed", label: "Send-failed", color: "gray" },
    ],
  },
  { id: "score", label: "Score", fieldType: "number", width: 84 },
  {
    id: "channel",
    label: "Channel",
    fieldType: "singleSelect",
    width: 124,
    options: [
      { id: "twitter", label: "twitter/x", color: "blue" },
      { id: "linkedin", label: "linkedin", color: "teal" },
      { id: "blog", label: "blog", color: "amber" },
    ],
  },
  { id: "owner", label: "Owner", fieldType: "text", width: 110 },
  {
    id: "tags",
    label: "Tags",
    fieldType: "multiSelect",
    flex: 1.3,
    minWidth: 150,
    creatableOptions: true,
    options: [
      { id: "launch", label: "launch", color: "purple" },
      { id: "infra", label: "infra", color: "blue" },
      { id: "growth", label: "growth", color: "green" },
      { id: "ai", label: "ai", color: "teal" },
    ],
  },
  { id: "created", label: "Created", fieldType: "date", width: 124 },
];

export const contentRows: DataGridRow[] = [
  {
    id: "r1",
    cells: {
      tweet:
        "We shipped per-step tool scoping today — every agent step runs with only the tools it was granted.",
      status: "drafted",
      score: 0.81,
      channel: "twitter",
      owner: "Cal",
      tags: ["launch", "infra"],
      created: "2026-06-29",
    },
  },
  {
    id: "r2",
    cells: {
      tweet: "Why we moved every workflow run into a fresh container",
      status: "approved",
      score: 0.78,
      channel: "twitter",
      owner: "Cal",
      tags: ["infra"],
      created: "2026-06-29",
    },
  },
  {
    id: "r3",
    cells: {
      tweet: "How scoped agents stay fully auditable",
      status: "drafted",
      score: 0.73,
      channel: "linkedin",
      owner: "Pat",
      tags: ["infra", "ai"],
      created: "2026-06-30",
    },
  },
  {
    id: "r4",
    cells: {
      tweet: "Migrate your CRM in one dry-run",
      status: "duplicate",
      score: 0.55,
      channel: "twitter",
      owner: "Bea",
      tags: ["growth"],
      created: "2026-06-28",
    },
  },
  {
    id: "r5",
    cells: {
      tweet: "Tonight's deploy notes",
      status: "sendfailed",
      score: 0.64,
      channel: "twitter",
      owner: "Cal",
      tags: [],
      created: "2026-06-28",
    },
  },
  {
    id: "r6",
    cells: {
      tweet: "per-step tool scoping is live the future is HERE",
      status: "offbrand",
      score: 0.42,
      channel: "twitter",
      owner: "Cal",
      tags: ["launch"],
      created: "2026-06-29",
    },
  },
  {
    id: "r7",
    cells: {
      tweet: "5 things we learned shipping automations on top of tables",
      status: "published",
      score: 0.88,
      channel: "blog",
      owner: "Cal",
      tags: ["growth", "ai"],
      created: "2026-06-27",
    },
  },
];

/** Build a large row set for virtualization / infinite-scroll stories. */
export function makeManyRows(count: number): DataGridRow[] {
  const statuses = ["drafted", "approved", "published", "duplicate"];
  const channels = ["twitter", "linkedin", "blog"];
  const owners = ["Cal", "Pat", "Bea"];
  const allTags = ["launch", "infra", "growth", "ai"];
  const rows: DataGridRow[] = [];
  for (let i = 0; i < count; i += 1) {
    rows.push({
      id: `row-${i}`,
      cells: {
        tweet: `Record ${i + 1}: a generated row for testing the grid body`,
        status: statuses[i % statuses.length],
        score: Number(((i % 100) / 100).toFixed(2)),
        channel: channels[i % channels.length],
        owner: owners[i % owners.length],
        tags: i % 3 === 0 ? [allTags[i % allTags.length]] : [],
        created: `2026-06-${String((i % 28) + 1).padStart(2, "0")}`,
      },
    });
  }
  return rows;
}
