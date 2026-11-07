import { Ellipsis, Rocket } from "lucide-react";

import { ActionButton, IconAction } from "../components/parts/Action";
import type { LinkTab } from "../components/parts/LinkTabs";
import type { ProjectStatus } from "../fixtures/projects";
import { paths } from "../paths";
import type { DeployState, ProjectState } from "./projectState";
import { ActivityTab } from "./tabs/ActivityTab";
import { FilesTab } from "./tabs/FilesTab";
import { OverviewTab } from "./tabs/OverviewTab";
import { SettingsTab } from "./tabs/SettingsTab";

/** The tabs of a project. Each tab links to the screen that shows it. */
export function tabsFor(state: ProjectState): LinkTab[] {
  return [
    {
      label: "Overview",
      to: paths.overview,
      current: state.tab === "overview",
    },
    {
      label: "Files",
      to: paths.files,
      count: state.content === "new" ? undefined : 43,
      current: state.tab === "files",
      focused: state.focus === "files-tab",
    },
    {
      label: "Activity",
      to: paths.activity,
      current: state.tab === "activity",
    },
    {
      label: "Settings",
      to: paths.settings,
      current: state.tab === "settings",
    },
  ];
}

/** The status of the project, which follows its last deploy. */
export function statusFor(deploy: DeployState): ProjectStatus {
  if (deploy === "running") return "deploying";
  return deploy === "failed" ? "failed" : "live";
}

/** The body of the current tab. */
export function TabBody(props: { state: ProjectState }) {
  const { state } = props;
  switch (state.tab) {
    case "overview":
      return <OverviewTab deploy={state.deploy} />;
    case "files":
      return <FilesTab empty={state.content === "new"} />;
    case "activity":
      return <ActivityTab />;
    case "settings":
      return <SettingsTab invalid={state.form === "invalid"} />;
  }
}

/** Deploy, which shows its progress while a deploy runs. */
export function DeployButton(props: { deploy: DeployState }) {
  const running = props.deploy === "running";
  return (
    <ActionButton
      busy={running}
      icon={Rocket}
      to={running ? undefined : paths.deployRunning}
      tone="primary"
    >
      {running ? "Deploying" : "Deploy"}
    </ActionButton>
  );
}

/** The trigger of the project menu, which links to the open menu. */
export function ProjectMenuButton(props: { open: boolean }) {
  return (
    <IconAction
      icon={Ellipsis}
      label="Project actions"
      menu
      quiet
      state={props.open ? "open" : "rest"}
      to={paths.actionsMenu}
    />
  );
}
