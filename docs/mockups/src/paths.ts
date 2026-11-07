/** The catalogue paths that the screens link to. */
export const paths = {
  overview: "workspace",
  settings: "workspace/density",
  settingsInvalid: "workspace/density/invalid",
  files: "workspace/links",
  activity: "workspace/links/activity",
  tabFocus: "workspace/links/keyboard",
  deployRunning: "workspace/feedback",
  deployFailed: "workspace/feedback/failed",
  newProject: "workspace/feedback/new-project",
  chooseProject: "workspace/feedback/choose",
  noResults: "workspace/feedback/choose/no-results",
  actionsMenu: "workspace/menus",
  sortMenu: "workspace/menus/sort",
  resizeHover: "workspace/panels",
  resizeDrag: "workspace/panels/dragging",
  resizeKeyboard: "workspace/panels/keyboard",
} as const;

/** The outside pages that link buttons open in a new tab. */
export const outsidePages = {
  preview: "https://billing.acme.example",
  help: "https://help.acme.example",
} as const;
