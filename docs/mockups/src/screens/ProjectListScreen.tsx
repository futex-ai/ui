import type { Viewport } from "@mokly/mokly";
import { ArrowDownUp, LayoutList, Plus, Search } from "lucide-react";

import { DesktopSurface, PhoneSurface } from "../components/common/Surface";
import { DesktopColumns, defaultColumns } from "../components/layout/Desktop";
import { PhoneBody, PhoneHeader } from "../components/layout/Phone";
import { ActionButton, IconAction } from "../components/parts/Action";
import { EmptyState } from "../components/parts/EmptyState";
import { TextField } from "../components/parts/Fields";
import { MenuSheet } from "../components/parts/MenuSheet";
import { paths } from "../paths";
import { sortChoices } from "./menus";
import { ProjectSections } from "./ProjectRows";
import { NoMatch, ProjectSidebar } from "./ProjectSidebar";
import { unmatchedSearch, type ProjectListState } from "./projectState";
import styles from "./ProjectListScreen.module.css";

function DesktopList(props: { state: ProjectListState; search?: string }) {
  return (
    <DesktopSurface>
      <DesktopColumns
        columns={defaultColumns}
        main={
          <EmptyState
            actions={
              <ActionButton icon={Plus} to={paths.newProject}>
                New project
              </ActionButton>
            }
            icon={LayoutList}
            level={1}
            title="Choose a project"
          >
            Its files, activity, and settings open here.
          </EmptyState>
        }
        sidebar={
          <ProjectSidebar
            currentStatus="live"
            search={props.search}
            sortOpen={props.state.menu === "sort"}
          />
        }
      />
    </DesktopSurface>
  );
}

function PhoneList(props: { state: ProjectListState; search?: string }) {
  const sortOpen = props.state.menu === "sort";
  return (
    <PhoneSurface>
      <PhoneHeader
        actions={
          <>
            <IconAction
              icon={ArrowDownUp}
              label="Sort projects"
              menu
              state={sortOpen ? "open" : "rest"}
              to={paths.sortMenu}
            />
            <IconAction
              icon={Plus}
              label="New project"
              to={paths.newProject}
              tone="primary"
            />
          </>
        }
        title="Projects"
      />
      <PhoneBody flush>
        <div className={styles.search}>
          <TextField
            clearable
            label="Search projects"
            placeholder="Search projects"
            prefixIcon={Search}
            value={props.search ?? ""}
          />
        </div>
        {props.search ? (
          <NoMatch level={2} search={props.search} />
        ) : (
          <ProjectSections currentStatus="live" />
        )}
      </PhoneBody>
      {sortOpen ? (
        <MenuSheet entries={sortChoices(false)} title="Sort projects" />
      ) : null}
    </PhoneSurface>
  );
}

/**
 * The project list: on desktop the list column beside a main column that
 * waits for a choice, and on a phone the home screen.
 */
export function ProjectListScreen(props: {
  state: ProjectListState;
  viewport: Viewport;
}) {
  const search =
    props.state.list === "no-results" ? unmatchedSearch : undefined;
  if (props.viewport === "mobile") {
    return <PhoneList search={search} state={props.state} />;
  }
  return <DesktopList search={search} state={props.state} />;
}
