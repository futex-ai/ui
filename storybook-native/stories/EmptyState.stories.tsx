import type { Meta, StoryObj } from "@storybook/react-native";
import { StyleSheet, View } from "react-native";
import { FolderOpen, GitCompareArrows, SearchX } from "lucide-react-native";

import { Button } from "@firna/ui/button";
import { EmptyState } from "@firna/ui/empty-state";
import { LinkButton } from "@firna/ui/link";
import { useSharedUiTheme } from "@firna/ui/theme";

import { StoryLog, StoryScreen, StorySection, useStoryLog } from "./storyParts";

/** A page empty state, centred in its area, with the next steps. */
function PageExample() {
  const log = useStoryLog();
  return (
    <StoryScreen>
      <View style={styles.page}>
        <EmptyState
          actions={
            <>
              <Button onPress={() => log.add("Upload files")} tone="primary">
                Upload files
              </Button>
              <LinkButton
                href="/atlas/settings"
                onNavigate={() => log.add("/atlas/settings")}
              >
                Connect a repository
              </LinkButton>
            </>
          }
          headingLevel={1}
          icon={FolderOpen}
          title="Add the first files"
        >
          Upload files, or connect a repository to sync them on every push.
        </EmptyState>
      </View>
      <StoryLog label="Last action" text={log.text} />
    </StoryScreen>
  );
}

/** Panel empty states sit at the top of their panel. */
function PanelExample() {
  const theme = useSharedUiTheme();
  const log = useStoryLog();
  const panel = [styles.panel, { borderColor: theme.colors.border }];
  return (
    <StoryScreen>
      <StorySection title="Changes panel">
        <View style={panel}>
          <EmptyState
            headingLevel={3}
            icon={GitCompareArrows}
            size="panel"
            title="Changes appear after the first push"
          />
        </View>
      </StorySection>
      <StorySection title="Search without results">
        <View style={panel}>
          <EmptyState
            actions={
              <LinkButton
                href="/projects"
                onNavigate={() => log.add("Clear search")}
                size="xs"
                tone="ghost"
              >
                Clear search
              </LinkButton>
            }
            headingLevel={3}
            icon={SearchX}
            size="panel"
            title="No projects match “zebra”"
          >
            Check the spelling, or search for another name.
          </EmptyState>
        </View>
      </StorySection>
      <StoryLog label="Last action" text={log.text} />
    </StoryScreen>
  );
}

const meta: Meta = { title: "Empty state/Native empty states" };

export default meta;

type Story = StoryObj;

export const Page: Story = { render: () => <PageExample /> };
export const Panel: Story = { render: () => <PanelExample /> };

const styles = StyleSheet.create({
  page: { minHeight: 420 },
  panel: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
});
