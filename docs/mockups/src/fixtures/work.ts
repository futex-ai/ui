/** Sample files, changes, and activity of the current project. */

export type ChangedFile = {
  name: string;
  folder: string;
  added: number;
  removed: number;
};

export const changes: readonly ChangedFile[] = [
  { name: "InvoiceTable.tsx", folder: "src/invoices", added: 48, removed: 6 },
  { name: "useInvoices.ts", folder: "src/invoices", added: 31, removed: 2 },
  { name: "invoices.test.ts", folder: "tests", added: 40, removed: 0 },
  { name: "routes.ts", folder: "src", added: 6, removed: 4 },
  { name: "README.md", folder: "", added: 3, removed: 2 },
];

export type ProjectFile = {
  name: string;
  folder: boolean;
  /** The size of a file, or the number of files in a folder. */
  detail: string;
  updated: string;
};

export const files: readonly ProjectFile[] = [
  { name: "src", folder: true, detail: "24 files", updated: "2m" },
  { name: "tests", folder: true, detail: "9 files", updated: "2m" },
  { name: "public", folder: true, detail: "6 files", updated: "3d" },
  { name: "package.json", folder: false, detail: "1.8 KB", updated: "1d" },
  { name: "README.md", folder: false, detail: "4.2 KB", updated: "2m" },
  { name: "tsconfig.json", folder: false, detail: "620 B", updated: "2w" },
  { name: "vite.config.ts", folder: false, detail: "1.1 KB", updated: "2w" },
];

export type Activity = {
  initials: string;
  title: string;
  detail: string;
  when: string;
  today: boolean;
};

export const activity: readonly Activity[] = [
  {
    initials: "AR",
    title: "Ana Ruiz deployed to production",
    detail: "Build 482 finished in 1 min 52 s",
    when: "2m",
    today: true,
  },
  {
    initials: "SL",
    title: "Sam Lee pushed 3 commits to main",
    detail: "Add filters to the invoice table",
    when: "18m",
    today: true,
  },
  {
    initials: "AR",
    title: "Ana Ruiz opened a preview",
    detail: "invoice-filters",
    when: "1h",
    today: true,
  },
  {
    initials: "KM",
    title: "Kai Moreau changed the default branch",
    detail: "From develop to main",
    when: "1d",
    today: false,
  },
  {
    initials: "SL",
    title: "Sam Lee invited Priya Shah",
    detail: "As a member",
    when: "3d",
    today: false,
  },
];
