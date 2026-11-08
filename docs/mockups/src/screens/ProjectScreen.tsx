import { mockLink, type Viewport } from "@mokly/mokly";
import { ChevronLeft, Globe, UserPlus } from "lucide-react";
import { LinkButton } from "@firna/ui/link";
import { InlineMenu, InlineMenuSheet } from "@firna/ui/popover";

import { DesktopSurface, PhoneSurface } from "../components/common/Surface";
import { Bar, DesktopColumns, Scroll } from "../components/layout/Desktop";
import {
  PhoneBody,
  PhoneFooter,
  PhoneHeader,
  PhoneTabs,
} from "../components/layout/Phone";
import { ActionButton } from "../components/parts/Action";
import { currentProject } from "../fixtures/projects";
import { noop } from "../noop";
import { outsidePages, paths } from "../paths";
import { ChangesPanel } from "./ChangesPanel";
import { firstProjectAction, projectActions } from "./menus";
import {
  DeployButton,
  ProjectMenuButton,
  ProjectTabs,
  statusFor,
  TabBody,
} from "./projectParts";
import { ProjectSidebar } from "./ProjectSidebar";
import { columnsFor, type ProjectState } from "./projectState";
import { SettingsActions } from "./tabs/SettingsTab";
import styles from "./ProjectScreen.module.css";

/** The menu wrapper sits in a bar that centres its controls. */
const barAnchor = { alignSelf: "center" } as const;

function DesktopProject(props: { state: ProjectState }) {
  const { state } = props;
  const main = (
    <>
      <Bar>
        <div className={styles.titles}>
          <h1 className={styles.title}>{currentProject.name}</h1>
          <span className={styles.repository}>{currentProject.repository}</span>
        </div>
        <div className={styles.secondary}>
          <LinkButton href={outsidePages.preview} icon={Globe} newTab size="xs">
            Open preview
          </LinkButton>
          <ActionButton icon={UserPlus}>Share</ActionButton>
        </div>
        <DeployButton deploy={state.deploy} />
        <InlineMenu
          activeId={firstProjectAction}
          align="end"
          entries={projectActions}
          label="Project actions"
          onClose={noop}
          open={state.menu === "actions"}
          size="xs"
          style={barAnchor}
          width={200}
        >
          <ProjectMenuButton open={state.menu === "actions"} />
        </InlineMenu>
      </Bar>
      <Bar slim>
        <ProjectTabs state={state} />
      </Bar>
      <Scroll>
        <div className={styles.page}>
          <TabBody state={state} />
        </div>
      </Scroll>
    </>
  );
  return (
    <DesktopSurface>
      <DesktopColumns
        columns={columnsFor(state.resize)}
        detail={<ChangesPanel empty={state.content === "new"} />}
        main={main}
        sidebar={
          <ProjectSidebar
            current={currentProject.id}
            currentStatus={statusFor(state.deploy)}
          />
        }
      />
    </DesktopSurface>
  );
}

function PhoneFoot(props: { state: ProjectState }) {
  switch (props.state.tab) {
    case "overview":
      return (
        <PhoneFooter>
          <ActionButton icon={UserPlus}>Share</ActionButton>
          <DeployButton deploy={props.state.deploy} />
        </PhoneFooter>
      );
    case "settings":
      return (
        <PhoneFooter>
          <SettingsActions />
        </PhoneFooter>
      );
    case "files":
    case "activity":
      return null;
  }
}

function PhoneProject(props: { state: ProjectState }) {
  const { state } = props;
  const menuOpen = state.menu === "actions";
  return (
    <PhoneSurface>
      <PhoneHeader
        actions={<ProjectMenuButton open={menuOpen} />}
        back={
          <LinkButton
            accessibilityLabel="Projects"
            href={mockLink(paths.chooseProject)}
            icon={ChevronLeft}
            shape="square"
            size="xs"
            tone="plain"
          />
        }
        subtitle={currentProject.repository}
        title={currentProject.name}
      />
      <PhoneTabs>
        <ProjectTabs fill state={state} />
      </PhoneTabs>
      <PhoneBody>
        <TabBody state={state} />
      </PhoneBody>
      <PhoneFoot state={state} />
      {menuOpen ? (
        <InlineMenuSheet
          entries={projectActions}
          label="Project actions"
          onClose={noop}
          size="xs"
          title={currentProject.name}
        />
      ) : null}
    </PhoneSurface>
  );
}

/**
 * A project: on desktop the project list, the project with its tabs, and
 * the changes panel; on a phone the project page alone.
 */
export function ProjectScreen(props: {
  state: ProjectState;
  viewport: Viewport;
}) {
  if (props.viewport === "mobile") return <PhoneProject state={props.state} />;
  return <DesktopProject state={props.state} />;
}
