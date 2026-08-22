/** Consumer-shaped List focus regression fixture for Storybook. */
import { ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Button,
  List,
  ListItem,
  WebModalFrame,
  useSharedUiTheme,
} from "../index";

type Repository = {
  host: string;
  id: string;
  location: string;
  name: string;
};

const repositories: Repository[] = [
  {
    host: "GH",
    id: "marketing-site",
    location: "GitHub · Connected today",
    name: "acme/marketing-site",
  },
  {
    host: "GL",
    id: "data-pipeline",
    location: "GitLab · Connected yesterday",
    name: "acme-ops/data-pipeline",
  },
  {
    host: "FN",
    id: "invoice-parser",
    location: "Kept in Firna",
    name: "invoice-parser",
  },
];

/**
 * Mirrors the consumer composition that exposed the regression: a modal owns a
 * static List, while each rich ListItem title is the press target and a
 * decorative chevron remains outside it. This fixture intentionally preserves
 * that narrower target for diagnosis; new one-action rows should normally use
 * List.onItemPress so the complete row is interactive.
 */
export function ListRepositoryPickerExample() {
  const [selected, setSelected] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const theme = useSharedUiTheme();

  return (
    <>
      <Button inline onPress={() => setVisible(true)}>
        Open repository picker
      </Button>
      <WebModalFrame
        onClose={() => setVisible(false)}
        size="sm"
        testID="repository-picker"
        title="New repository section"
        visible={visible}
      >
        <Text style={[styles.body, { color: theme.colors.muted }]}>
          Pick a connected repository for this section.
        </Text>
        <Text style={[styles.status, { color: theme.colors.ink }]}>
          {selected ? `Selected ${selected}` : "No repository selected"}
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <List<Repository>
            accessibilityLabel="Connected repositories"
            itemKey={(repository) => repository.id}
            items={repositories}
            renderItem={(repository) => (
              <ListItem
                accessibilityLabel={repository.name}
                onPress={() => setSelected(repository.name)}
                testID={`repository-option-${repository.id}`}
                title={
                  <View style={styles.repositoryTitle}>
                    <View
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      style={[
                        styles.host,
                        { backgroundColor: theme.colors.primarySoft },
                      ]}
                    >
                      <Text
                        style={[
                          styles.hostText,
                          { color: theme.colors.primaryDeep },
                        ]}
                      >
                        {repository.host}
                      </Text>
                    </View>
                    <View style={styles.repositoryLabel}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.repositoryName,
                          { color: theme.colors.ink },
                        ]}
                      >
                        {repository.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.repositoryMeta,
                          { color: theme.colors.muted },
                        ]}
                      >
                        {repository.location}
                      </Text>
                    </View>
                  </View>
                }
                trailing={
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    testID={`repository-chevron-${repository.id}`}
                  >
                    <ChevronRight color={theme.colors.muted} size={18} />
                  </View>
                }
              />
            )}
          />
        </View>
      </WebModalFrame>
    </>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  host: {
    alignItems: "center",
    borderRadius: 7,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  hostText: { fontSize: 9, fontWeight: "800" },
  repositoryLabel: { flexShrink: 1, gap: 2, minWidth: 0 },
  repositoryMeta: { fontSize: 11.5 },
  repositoryName: { fontSize: 13.5, fontWeight: "600" },
  repositoryTitle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minWidth: 0,
  },
  status: { fontSize: 12, fontWeight: "600", marginBottom: 12 },
});
