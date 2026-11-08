import { mockLink } from "@mokly/mokly";
import { Globe } from "lucide-react";
import { Avatar } from "@firna/ui/avatar";
import { LinkButton } from "@firna/ui/link";
import { ListItem } from "@firna/ui/list";
import { Text } from "@firna/ui/typography";

import { useSurface } from "../../components/common/Surface";
import { Section } from "../../components/layout/Section";
import { RowDetail, RowList } from "../../components/parts/Rows";
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
    <ListItem
      description={props.item.detail}
      leading={
        <Avatar decorative label={props.item.initials} size={phone ? 32 : 22} />
      }
      size="xs"
      title={props.item.title}
      trailing={<RowDetail>{props.item.when}</RowDetail>}
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
        <Text color="secondary">{currentProject.description}</Text>
        {phone ? (
          <LinkButton
            block
            href={outsidePages.preview}
            icon={Globe}
            newTab
            size="xs"
          >
            Open preview
          </LinkButton>
        ) : null}
      </Section>
      {phone ? (
        <Section
          action={<Text variant="caption">{changeSummary}</Text>}
          title="Changes"
        >
          <ChangeRows bleed />
        </Section>
      ) : null}
      <Section
        action={
          <LinkButton href={mockLink(paths.activity)} size="xs" tone="ghost">
            All activity
          </LinkButton>
        }
        title="Recent activity"
      >
        <RowList
          bleed
          itemKey={(item) => item.title}
          items={activity.slice(0, 3)}
          label="Recent activity"
          renderItem={(item) => <ActivityRow item={item} />}
        />
      </Section>
    </>
  );
}
