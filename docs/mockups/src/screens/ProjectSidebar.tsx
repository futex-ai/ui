import { ArrowDownUp, LifeBuoy, Plus, Search, SearchX } from "lucide-react";

import { Bar, Scroll } from "../components/layout/Desktop";
import { IconAction } from "../components/parts/Action";
import { EmptyState } from "../components/parts/EmptyState";
import { TextField } from "../components/parts/Fields";
import { LinkButton } from "../components/parts/LinkButton";
import { Menu, MenuAnchor } from "../components/parts/Menu";
import type { ProjectStatus } from "../fixtures/projects";
import { outsidePages, paths } from "../paths";
import { sortChoices } from "./menus";
import { ProjectSections } from "./ProjectRows";
import styles from "./ProjectSidebar.module.css";

/** The search that matches no project, and its empty state. */
export function NoMatch(props: { search: string; level: 2 | 3 }) {
  return (
    <EmptyState
      actions={
        <LinkButton tone="ghost" to={paths.chooseProject}>
          Clear search
        </LinkButton>
      }
      icon={SearchX}
      level={props.level}
      size="panel"
      title={`No projects match “${props.search}”`}
    >
      Check the spelling, or search for another name.
    </EmptyState>
  );
}

/**
 * The project list column of the desktop layout: its title and actions, a
 * dense search field, dense project rows, and a help link at its foot.
 */
export function ProjectSidebar(props: {
  current?: string;
  currentStatus: ProjectStatus;
  search?: string;
  sortOpen?: boolean;
}) {
  return (
    <>
      <Bar>
        <h2 className={styles.title}>Projects</h2>
        <MenuAnchor>
          <IconAction
            icon={ArrowDownUp}
            label="Sort projects"
            menu
            quiet
            state={props.sortOpen ? "open" : "rest"}
            to={paths.sortMenu}
          />
          {props.sortOpen ? (
            <Menu
              align="start"
              entries={sortChoices(true)}
              label="Sort projects"
              width={208}
            />
          ) : null}
        </MenuAnchor>
        <IconAction
          icon={Plus}
          label="New project"
          quiet
          to={paths.newProject}
        />
      </Bar>
      <div className={styles.search}>
        <TextField
          clearable
          label="Search projects"
          placeholder="Search projects"
          prefixIcon={Search}
          value={props.search ?? ""}
        />
      </div>
      <Scroll padded>
        {props.search ? (
          <NoMatch level={3} search={props.search} />
        ) : (
          <ProjectSections
            current={props.current}
            currentStatus={props.currentStatus}
          />
        )}
      </Scroll>
      <div className={styles.foot}>
        <LinkButton
          alignStart
          block
          href={outsidePages.help}
          icon={LifeBuoy}
          tone="plain"
        >
          Help center
        </LinkButton>
      </div>
    </>
  );
}
