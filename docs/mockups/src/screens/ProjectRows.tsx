import { mockLink } from "@mokly/mokly";
import { ChevronRight } from "lucide-react";
import { ListItem } from "@firna/ui/list";
import { StatusDot, type StatusDotTone } from "@firna/ui/status-dot";

import { useSurface } from "../components/common/Surface";
import { RowDetail, RowSection } from "../components/parts/Rows";
import {
  projects,
  type Project,
  type ProjectStatus,
} from "../fixtures/projects";
import { paths } from "../paths";
import styles from "./ProjectRows.module.css";

const STATUS_TONE: Record<ProjectStatus, StatusDotTone> = {
  live: "primary",
  deploying: "primary",
  failed: "danger",
  paused: "neutral",
};

/** The status in words. A live project shows its time instead. */
const STATUS_WORD: Record<ProjectStatus, string | undefined> = {
  live: undefined,
  deploying: "Deploying",
  failed: "Failed",
  paused: "Paused",
};

function Trailing(props: { project: Project; chevron: boolean }) {
  const { project } = props;
  const word = STATUS_WORD[project.status];
  return (
    <RowDetail>
      {word ? (
        <span className={project.status === "failed" ? styles.failed : ""}>
          {word}
        </span>
      ) : (
        project.updated
      )}
      {props.chevron ? <ChevronRight aria-hidden size={16} /> : null}
    </RowDetail>
  );
}

/**
 * The pinned projects and all the others, as navigation rows that open the
 * project. The row of the current project carries the current page. The
 * status dot speaks only for a live project, because the row states every
 * other status in words.
 */
export function ProjectSections(props: {
  current?: string;
  /** The status of the current project, which follows its last deploy. */
  currentStatus: ProjectStatus;
}) {
  const phone = useSurface() === "phone";
  const list = projects.map((project) =>
    project.id === props.current
      ? { ...project, status: props.currentStatus }
      : project,
  );
  const rows = {
    itemKey: (project: Project) => project.id,
    itemLink: (project: Project) => ({
      current: project.id === props.current,
      href: mockLink(paths.overview),
    }),
    renderItem: (project: Project) => (
      <ListItem
        leading={
          <StatusDot
            label={project.status === "live" ? "Live" : undefined}
            size={phone ? "md" : "sm"}
            tone={STATUS_TONE[project.status]}
          />
        }
        size="xs"
        title={project.name}
        trailing={<Trailing chevron={phone} project={project} />}
      />
    ),
  };
  return (
    <>
      <RowSection
        {...rows}
        items={list.filter((project) => project.pinned)}
        title="Pinned"
      />
      <RowSection
        {...rows}
        items={list.filter((project) => !project.pinned)}
        title="All projects"
      />
    </>
  );
}
