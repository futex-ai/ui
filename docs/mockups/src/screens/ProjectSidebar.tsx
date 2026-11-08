import { mockLink } from "@mokly/mokly";
import { ArrowDownUp, LifeBuoy, Plus, Search, SearchX } from "lucide-react";
import { EmptyState } from "@firna/ui/empty-state";
import { LinkButton } from "@firna/ui/link";
import { InlineMenu } from "@firna/ui/popover";

import { Bar, Scroll } from "../components/layout/Desktop";
import { IconAction } from "../components/parts/Action";
import { TextField } from "../components/parts/Fields";
import type { ProjectStatus } from "../fixtures/projects";
import { noop } from "../noop";
import { outsidePages, paths } from "../paths";
import { currentSortChoice, sortChoices } from "./menus";
import { ProjectSections } from "./ProjectRows";
import styles from "./ProjectSidebar.module.css";

/** The search that matches no project, and its empty state. */
export function NoMatch(props: { search: string; level: 2 | 3 }) {
  return (
    <EmptyState
      actions={
        <LinkButton href={mockLink(paths.chooseProject)} size="xs" tone="ghost">
          Clear search
        </LinkButton>
      }
      headingLevel={props.level}
      icon={SearchX}
      size="panel"
      title={`No projects match “${props.search}”`}
    >
      Check the spelling, or search for another name.
    </EmptyState>
  );
}

/** The help link fills the foot, with its label at the start. */
const startAligned = { justifyContent: "flex-start" } as const;
const fillLabel = { flex: 1 } as const;

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
        <InlineMenu
          activeId={currentSortChoice}
          align="start"
          entries={sortChoices}
          label="Sort projects"
          onClose={noop}
          open={props.sortOpen ?? false}
          size="xs"
          style={{ alignSelf: "center" }}
          width={208}
        >
          <IconAction
            icon={ArrowDownUp}
            label="Sort projects"
            menu
            quiet
            state={props.sortOpen ? "open" : "rest"}
            to={paths.sortMenu}
          />
        </InlineMenu>
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
          block
          href={outsidePages.help}
          icon={LifeBuoy}
          labelStyle={fillLabel}
          newTab
          size="xs"
          style={startAligned}
          tone="plain"
        >
          Help center
        </LinkButton>
      </div>
    </>
  );
}
