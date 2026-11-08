/**
 * The examples of the empty-state stories: a page empty state that centres in
 * its area, and panel empty states at the top of a side panel. The titles take
 * the heading level of their place in the page, with the same size.
 */
import { GitBranch, Inbox, Search } from "../primitives/icons";
import { StyleSheet, View } from "../primitives/reactNative";

import { EmptyState } from "../empty-state";
import { LinkButton } from "../link";

/** The story stays on its page when a link in it is followed. */
const stay = () => undefined;

/** The files view of a new project: a page empty state with an action. */
export function EmptyPageExample() {
  return (
    <View style={styles.page}>
      <EmptyState
        actions={
          <LinkButton href="/atlas/settings" onNavigate={stay} size="xs">
            Connect a repository
          </LinkButton>
        }
        headingLevel={2}
        icon={Inbox}
        testID="files-empty"
        title="No files yet"
      >
        Connect a repository to see its files here.
      </EmptyState>
    </View>
  );
}

/** Side panels with nothing to show, at the top of each panel. */
export function EmptyPanelExample() {
  return (
    <View style={styles.panels}>
      <View style={styles.panel}>
        <EmptyState
          headingLevel={3}
          icon={GitBranch}
          size="panel"
          testID="changes-empty"
          title="Changes appear after the first push"
        />
      </View>
      <View style={styles.panel}>
        <EmptyState
          actions={
            <LinkButton
              href="/projects"
              onNavigate={stay}
              size="xs"
              tone="ghost"
            >
              Clear search
            </LinkButton>
          }
          headingLevel={3}
          icon={Search}
          size="panel"
          title="No projects match “atlsa”"
        >
          Check the spelling, or search for another name.
        </EmptyState>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    borderColor: "rgba(28, 31, 29, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    height: 320,
    width: 560,
  },
  panel: {
    borderColor: "rgba(28, 31, 29, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    height: 280,
    width: 260,
  },
  panels: { flexDirection: "row", gap: 16 },
});
