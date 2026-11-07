import { Avatar } from "@firna/ui/avatar";
import { Globe } from "lucide-react";

import { Txt } from "../../components/common/Txt";
import { useSurface } from "../../components/common/Surface";
import { Section } from "../../components/layout/Section";
import { LinkButton } from "../../components/parts/LinkButton";
import { Row, RowList } from "../../components/parts/Rows";
import { currentProject } from "../../fixtures/projects";
import { activity, type Activity } from "../../fixtures/work";
import { outsidePages, paths } from "../../paths";
import { ChangeRows, changeSummary } from "../ChangesPanel";
import { DeployNotice } from "../DeployNotice";
import type { DeployState } from "../projectState";

/** A two-line activity row: who did what, a detail, and when. */
export function ActivityRow(props: { item: Activity }) {
  const phone = useSurface() === "phone";
  return (
    <Row
      detail={props.item.detail}
      leading={
        <Avatar decorative label={props.item.initials} size={phone ? 32 : 22} />
      }
      title={props.item.title}
      trailing={props.item.when}
    />
  );
}

/**
 * The overview of the project. A phone has no changes panel, so it shows
 * the changes here, with the preview link that the desktop header holds.
 */
export function OverviewTab(props: { deploy: DeployState }) {
  const phone = useSurface() === "phone";
  return (
    <>
      <DeployNotice deploy={props.deploy} />
      <Section title="About">
        <Txt color="secondary">{currentProject.description}</Txt>
        {phone ? (
          <LinkButton block href={outsidePages.preview} icon={Globe}>
            Open preview
          </LinkButton>
        ) : null}
      </Section>
      {phone ? (
        <Section
          action={<Txt variant="caption">{changeSummary}</Txt>}
          title="Changes"
        >
          <ChangeRows bleed />
        </Section>
      ) : null}
      <Section
        action={
          <LinkButton tone="ghost" to={paths.activity}>
            All activity
          </LinkButton>
        }
        title="Recent activity"
      >
        <RowList bleed divided={phone} label="Recent activity">
          {activity.slice(0, 3).map((item) => (
            <ActivityRow item={item} key={item.title} />
          ))}
        </RowList>
      </Section>
    </>
  );
}
