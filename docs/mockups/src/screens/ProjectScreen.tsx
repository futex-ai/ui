import type { Viewport } from "@mokly/mokly";
import { ChevronLeft, Globe, UserPlus } from "lucide-react";

import { DesktopSurface, PhoneSurface } from "../components/common/Surface";
import { Bar, DesktopColumns, Scroll } from "../components/layout/Desktop";
import {
  PhoneBody,
  PhoneFooter,
  PhoneHeader,
  PhoneTabs,
} from "../components/layout/Phone";
import { ActionButton } from "../components/parts/Action";
import { IconLinkButton, LinkButton } from "../components/parts/LinkButton";
import { LinkTabs } from "../components/parts/LinkTabs";
import { Menu, MenuAnchor } from "../components/parts/Menu";
import { MenuSheet } from "../components/parts/MenuSheet";
import { currentProject } from "../fixtures/projects";
import { outsidePages, paths } from "../paths";
import { ChangesPanel } from "./ChangesPanel";
import { projectActions } from "./menus";
import {
  DeployButton,
  ProjectMenuButton,
  statusFor,
  TabBody,
  tabsFor,
} from "./projectParts";
import { ProjectSidebar } from "./ProjectSidebar";
import { columnsFor, type ProjectState } from "./projectState";
import { SettingsActions } from "./tabs/SettingsTab";
import styles from "./ProjectScreen.module.css";

function DesktopProject(props: { state: ProjectState }) {
  const { state } = props;
  const menuOpen = state.menu === "actions";
  const main = (
    <>
      <Bar>
        <div className={styles.titles}>
          <h1 className={styles.title}>{currentProject.name}</h1>
          <span className={styles.repository}>{currentProject.repository}</span>
        </div>
        <div className={styles.secondary}>
          <LinkButton href={outsidePages.preview} icon={Globe}>
            Open preview
          </LinkButton>
          <ActionButton icon={UserPlus}>Share</ActionButton>
        </div>
        <DeployButton deploy={state.deploy} />
        <MenuAnchor>
          <ProjectMenuButton open={menuOpen} />
          {menuOpen ? (
            <Menu
              align="end"
              entries={projectActions(true)}
              label="Project actions"
              width={200}
            />
          ) : null}
        </MenuAnchor>
      </Bar>
      <Bar slim>
        <LinkTabs label="Project" tabs={tabsFor(state)} />
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
          <IconLinkButton
            icon={ChevronLeft}
            label="Projects"
            to={paths.chooseProject}
          />
        }
        subtitle={currentProject.repository}
        title={currentProject.name}
      />
      <PhoneTabs>
        <LinkTabs fill label="Project" tabs={tabsFor(state)} />
      </PhoneTabs>
      <PhoneBody>
        <TabBody state={state} />
      </PhoneBody>
      <PhoneFoot state={state} />
      {menuOpen ? (
        <MenuSheet
          entries={projectActions(false)}
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
