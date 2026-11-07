import { StatusDot, type StatusDotTone } from "@firna/ui/status-dot";
import { ChevronRight } from "lucide-react";

import { useSurface } from "../components/common/Surface";
import { Row, RowSection } from "../components/parts/Rows";
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
    <>
      {word ? (
        <span className={project.status === "failed" ? styles.failed : ""}>
          {word}
        </span>
      ) : (
        project.updated
      )}
      {props.chevron ? <ChevronRight aria-hidden size={16} /> : null}
    </>
  );
}

/**
 * The pinned projects and all the others, as rows that open the project.
 * The status dot speaks only for a live project, because the row states
 * every other status in words.
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
  const row = (project: Project) => (
    <Row
      current={project.id === props.current}
      key={project.id}
      leading={
        <StatusDot
          label={project.status === "live" ? "Live" : undefined}
          size={phone ? "md" : "sm"}
          tone={STATUS_TONE[project.status]}
        />
      }
      title={project.name}
      to={paths.overview}
      trailing={<Trailing chevron={phone} project={project} />}
    />
  );
  return (
    <>
      <RowSection divided={phone} title="Pinned">
        {list.filter((project) => project.pinned).map(row)}
      </RowSection>
      <RowSection divided={phone} title="All projects">
        {list.filter((project) => !project.pinned).map(row)}
      </RowSection>
    </>
  );
}
