import { detailWidth, sidebarWidth } from "../design/panelWidths";
import { defaultColumns, type ColumnState } from "../components/layout/Desktop";

export const projectTabs = [
  "overview",
  "files",
  "activity",
  "settings",
] as const;
export const deployStates = ["live", "running", "failed"] as const;
export const contentStates = ["full", "new"] as const;
export const projectMenus = ["none", "actions"] as const;
export const resizeStates = [
  "rest",
  "sidebar-hover",
  "detail-drag",
  "sidebar-keyboard",
] as const;
export const focusTargets = ["none", "files-tab"] as const;
export const formStates = ["clean", "invalid"] as const;

export type ProjectTab = (typeof projectTabs)[number];
export type DeployState = (typeof deployStates)[number];
export type ResizeState = (typeof resizeStates)[number];

/** The state of the project screen, which the catalogue offers as controls. */
export type ProjectState = {
  tab: ProjectTab;
  /** The last deploy: live, running now, or failed. */
  deploy: DeployState;
  /** A new project has no files and no changes yet. */
  content: (typeof contentStates)[number];
  /** The project menu: closed, or open. */
  menu: (typeof projectMenus)[number];
  resize: ResizeState;
  /** A control that shows keyboard focus. */
  focus: (typeof focusTargets)[number];
  form: (typeof formStates)[number];
};

export const projectStateSchema = {
  type: "object",
  additionalProperties: false,
  required: ["tab", "deploy", "content", "menu", "resize", "focus", "form"],
  properties: {
    tab: { enum: projectTabs },
    deploy: { enum: deployStates },
    content: { enum: contentStates },
    menu: { enum: projectMenus },
    resize: { enum: resizeStates },
    focus: { enum: focusTargets },
    form: { enum: formStates },
  },
} as const;

/** The overview of a live project, with nothing open. */
export const projectAtRest: ProjectState = {
  tab: "overview",
  deploy: "live",
  content: "full",
  menu: "none",
  resize: "rest",
  focus: "none",
  form: "clean",
};

/** The widths of the columns and the state of each handle. */
export function columnsFor(resize: ResizeState): ColumnState {
  switch (resize) {
    case "rest":
      return defaultColumns;
    case "sidebar-hover":
      return {
        ...defaultColumns,
        sidebar: { width: sidebarWidth.value, handle: "hover" },
      };
    case "detail-drag":
      return {
        ...defaultColumns,
        detail: { width: detailWidth.value + 112, handle: "drag" },
      };
    case "sidebar-keyboard":
      return {
        ...defaultColumns,
        sidebar: { width: sidebarWidth.min, handle: "focus" },
      };
  }
}

export const listStates = ["projects", "no-results"] as const;
export const listMenus = ["none", "sort"] as const;

/** The state of the project list screen. */
export type ProjectListState = {
  /** All projects, or a search that matches none. */
  list: (typeof listStates)[number];
  /** The sort menu: closed, or open. */
  menu: (typeof listMenus)[number];
};

export const projectListStateSchema = {
  type: "object",
  additionalProperties: false,
  required: ["list", "menu"],
  properties: {
    list: { enum: listStates },
    menu: { enum: listMenus },
  },
} as const;

/** The search text that matches no project. */
export const unmatchedSearch = "zebra";
