import { mockLink } from "@mokly/mokly";
import { Ellipsis, Rocket } from "lucide-react";
import { LinkTabs, type LinkTab } from "@firna/ui/link";
import { useSharedUiTheme } from "@firna/ui/theme";

import { focusGlow, type ButtonStyle } from "../components/common/drawnState";
import { ActionButton, IconAction } from "../components/parts/Action";
import type { ProjectStatus } from "../fixtures/projects";
import { paths } from "../paths";
import type { DeployState, ProjectState } from "./projectState";
import { ActivityTab } from "./tabs/ActivityTab";
import { FilesTab } from "./tabs/FilesTab";
import { OverviewTab } from "./tabs/OverviewTab";
import { SettingsTab } from "./tabs/SettingsTab";

/**
 * The tabs of a project. Each tab links to the screen that shows it. A tab
 * with drawn keyboard focus takes the focus glow through its `style`.
 */
function tabsFor(state: ProjectState, focusStyle: ButtonStyle): LinkTab[] {
  return [
    {
      current: state.tab === "overview",
      href: mockLink(paths.overview),
      label: "Overview",
    },
    {
      count: state.content === "new" ? undefined : 43,
      current: state.tab === "files",
      href: mockLink(paths.files),
      label: "Files",
      style: state.focus === "files-tab" ? focusStyle : undefined,
    },
    {
      current: state.tab === "activity",
      href: mockLink(paths.activity),
      label: "Activity",
    },
    {
      current: state.tab === "settings",
      href: mockLink(paths.settings),
      label: "Settings",
    },
  ];
}

/** The library `LinkTabs` of a project. A phone fills the bar with them. */
export function ProjectTabs(props: { state: ProjectState; fill?: boolean }) {
  const theme = useSharedUiTheme();
  return (
    <LinkTabs
      accessibilityLabel="Project"
      fill={props.fill}
      size="xs"
      tabs={tabsFor(props.state, focusGlow(theme))}
    />
  );
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
