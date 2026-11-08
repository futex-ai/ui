import type { Meta, StoryObj } from "@storybook/react-native";
import { useState } from "react";
import { OctagonAlert } from "lucide-react-native";

import { Button } from "@firna/ui/button";
import { LinkButton } from "@firna/ui/link";
import { Notice } from "@firna/ui/notice";
import { Spinner } from "@firna/ui/spinner";
import { useSharedUiTheme } from "@firna/ui/theme";
import { Text, TextScaleProvider } from "@firna/ui/typography";

import {
  StoryLog,
  StoryRow,
  StoryScreen,
  StorySection,
  useStoryLog,
} from "./storyParts";

/** A neutral notice with a spinner and an urgent notice with two actions. */
function NoticePair({ onAction }: { onAction: (action: string) => void }) {
  const theme = useSharedUiTheme();
  return (
    <>
      <Notice
        actions={
          <LinkButton
            href="/atlas/activity"
            onNavigate={() => onAction("View log")}
            size="xs"
            tone="plain"
          >
            View log
          </LinkButton>
        }
        iconNode={<Spinner color={theme.colors.muted} size={16} />}
        title="Deploying to production"
      >
        The live site updates when the deploy finishes.
      </Notice>
      <Notice
        actions={
          <>
            <LinkButton
              href="/atlas/activity"
              onNavigate={() => onAction("View log")}
              size="xs"
              tone="plain"
            >
              View log
            </LinkButton>
            <Button onPress={() => onAction("Try again")} size="xs">
              Try again
            </Button>
          </>
        }
        icon={OctagonAlert}
        title="The deploy failed"
        tone="urgent"
      >
        The build stopped at the test step. The live site still runs the last
        good deploy.
      </Notice>
    </>
  );
}

function TonesExample() {
  const log = useStoryLog();
  return (
    <StoryScreen>
      <StorySection title="Neutral and urgent">
        <NoticePair onAction={log.add} />
      </StorySection>
      <StoryLog label="Last action" text={log.text} />
    </StoryScreen>
  );
}

const checks = ["Unit tests", "Type check", "Accessibility scan"];

/**
 * An urgent notice that appears and changes on request. Native announces its
 * message through the platform screen reader when it appears and when the
 * message changes. A neutral notice announces nothing.
 */
function AnnouncementExample() {
  const [failed, setFailed] = useState<string | null>(null);
  const next = () =>
    setFailed(
      (current) => checks[(checks.indexOf(current ?? "") + 1) % checks.length],
    );
  return (
    <StoryScreen>
      <StoryRow>
        <Button onPress={next} size="xs" tone="primary">
          {failed ? "Fail another check" : "Run the checks"}
        </Button>
        <Button onPress={() => setFailed(null)} size="xs" tone="ghost">
          Clear
        </Button>
      </StoryRow>
      {failed ? (
        <Notice
          announcementText={`Checks failed. ${failed} did not pass.`}
          icon={OctagonAlert}
          title="Checks failed"
          tone="urgent"
        >
          <Text color="secondary">{`${failed} did not pass.`}</Text>
        </Notice>
      ) : (
        <Notice title="No check has failed" />
      )}
    </StoryScreen>
  );
}

/** Both tones on a compact surface. The notice text follows the scale. */
function CompactExample() {
  const log = useStoryLog();
  return (
    <TextScaleProvider scale="compact">
      <StoryScreen>
        <StorySection title="Compact text scale">
          <NoticePair onAction={log.add} />
        </StorySection>
        <StoryLog label="Last action" text={log.text} />
      </StoryScreen>
    </TextScaleProvider>
  );
}

const meta: Meta = { title: "Notice/Native notices" };

export default meta;

type Story = StoryObj;

export const Tones: Story = { render: () => <TonesExample /> };
export const Announcement: Story = { render: () => <AnnouncementExample /> };
export const Compact: Story = { render: () => <CompactExample /> };
