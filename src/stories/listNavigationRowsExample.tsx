/**
 * Navigation rows: each row is a link inside its list item, the row of the
 * current page is tinted with an accent title, and one row opens a page
 * outside the app in a new tab. On the phone, the same dense list takes the
 * touch row metrics. A list at the default size keeps its heavier titles.
 */
import { useState } from "react";
import { StyleSheet, View } from "../primitives/reactNative";

import { Caption, List, ListItem } from "../index";
import { TouchSurface } from "../touchSurface";

type Project = { id: string; name: string; updated: string };

const projects: Project[] = [
  { id: "atlas", name: "Atlas", updated: "2m" },
  { id: "billing", name: "Billing", updated: "1h" },
  { id: "mobile", name: "Mobile app", updated: "3d" },
];

/**
 * The project rows. The detail trails a dense row, and sits under the title
 * on the phone. Text on the tint of the current row uses the secondary ink,
 * because muted text falls below 4.5:1 there.
 */
function ProjectLinks({
  detail,
  label,
  onOpen,
  size = "xs",
}: {
  detail: "description" | "trailing";
  label: string;
  onOpen: (project: Project) => void;
  size?: "xs" | "md";
}) {
  return (
    <List<Project>
      accessibilityLabel={label}
      itemKey={(project) => project.id}
      itemLink={(project) => ({
        current: project.id === "atlas",
        href: `/projects/${project.id}`,
      })}
      items={projects}
      onItemNavigate={onOpen}
      renderItem={(project) => (
        <ListItem
          description={
            detail === "description"
              ? `Updated ${project.updated} ago`
              : undefined
          }
          size={size}
          title={project.name}
          trailing={
            detail === "trailing" ? (
              <Caption color="secondary">{project.updated}</Caption>
            ) : undefined
          }
        />
      )}
      separators={false}
      size={size}
    />
  );
}

export function ListNavigationRowsExample() {
  const [opened, setOpened] = useState("none");
  const open = (project: Project) => setOpened(project.name);
  return (
    <View style={styles.stack}>
      <View style={styles.sidebar}>
        <ProjectLinks detail="trailing" label="Projects" onOpen={open} />
        <List<string>
          accessibilityLabel="Resources"
          itemKey={(name) => name}
          itemLink={() => ({ href: "https://help.example.com", newTab: true })}
          items={["Help center"]}
          renderItem={(name) => <ListItem size="xs" title={name} />}
          separators={false}
          size="xs"
        />
      </View>
      <View style={styles.card}>
        <ProjectLinks
          detail="trailing"
          label="Recent projects"
          onOpen={open}
          size="md"
        />
      </View>
      <TouchSurface>
        <View style={styles.phone}>
          <ProjectLinks
            detail="description"
            label="All projects"
            onOpen={open}
          />
        </View>
      </TouchSurface>
      <Caption>{`Opened: ${opened}`}</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: "rgba(28, 31, 29, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    width: 360,
  },
  phone: {
    borderColor: "rgba(28, 31, 29, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    width: 360,
  },
  sidebar: {
    borderColor: "rgba(28, 31, 29, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 4,
    width: 232,
  },
  stack: { gap: 12 },
});
