/** Sample data for the mockups. Product code reads real data. */

export type ProjectStatus = "live" | "deploying" | "failed" | "paused";

export type Project = {
  id: string;
  name: string;
  repository: string;
  status: ProjectStatus;
  /** The time since the last activity, as the list shows it. */
  updated: string;
  pinned: boolean;
};

/** The project that the project screens open. */
export const currentProject = {
  id: "billing",
  name: "Billing portal",
  repository: "acme/billing-portal",
  description:
    "The customer billing portal: invoices, payment methods, and receipts for every Acme account.",
} as const;

export const projects: readonly Project[] = [
  {
    id: "billing",
    name: "Billing portal",
    repository: "acme/billing-portal",
    status: "live",
    updated: "2m",
    pinned: true,
  },
  {
    id: "onboarding",
    name: "Onboarding emails",
    repository: "acme/onboarding",
    status: "live",
    updated: "1h",
    pinned: true,
  },
  {
    id: "payments",
    name: "Payments API",
    repository: "acme/payments-api",
    status: "failed",
    updated: "3h",
    pinned: false,
  },
  {
    id: "docs",
    name: "Docs site",
    repository: "acme/docs",
    status: "live",
    updated: "5h",
    pinned: false,
  },
  {
    id: "mobile",
    name: "Mobile app",
    repository: "acme/mobile",
    status: "paused",
    updated: "2d",
    pinned: false,
  },
  {
    id: "tokens",
    name: "Design tokens",
    repository: "acme/tokens",
    status: "live",
    updated: "4d",
    pinned: false,
  },
  {
    id: "status",
    name: "Status page",
    repository: "acme/status",
    status: "live",
    updated: "1w",
    pinned: false,
  },
  {
    id: "exports",
    name: "Data exports",
    repository: "acme/exports",
    status: "live",
    updated: "2w",
    pinned: false,
  },
];
