import type { Meta, StoryObj } from "@storybook/react-native";

import {
  Link,
  Path,
  Pressable,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@firna/ui/primitives";
import { useSharedUiTheme } from "@firna/ui/theme";

import { StoryLog, StoryScreen, StorySection, useStoryLog } from "./storyParts";

function ProjectActionsExample() {
  const { colors } = useSharedUiTheme();
  const log = useStoryLog();

  return (
    <StoryScreen>
      <StorySection title="Project actions">
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => log.add("Save")}
            style={styles.action}
          >
            <Svg aria-hidden width={16} height={16} viewBox="0 0 16 16">
              <Path
                d="M3 8l3 3 7-7"
                fill="none"
                stroke={colors.primary}
                strokeWidth={2}
              />
            </Svg>
            <Text style={{ color: colors.ink }}>Save</Text>
          </Pressable>
          <Link
            href="/help"
            onNavigate={() => log.add("Help")}
            style={styles.action}
          >
            <Text style={{ color: colors.primaryDeep }}>Help</Text>
          </Link>
        </View>
        <StoryLog label="Last action" text={log.text} />
      </StorySection>
    </StoryScreen>
  );
}

const meta: Meta = { title: "Primitives/Native primitives" };

export default meta;

export const ProjectActions: StoryObj = {
  render: () => <ProjectActionsExample />,
};

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 8,
  },
  actions: { flexDirection: "row", gap: 12 },
});
