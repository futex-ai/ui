import type { Meta, StoryObj } from "@storybook/react-native";
import { useState } from "react";
import { FileCode2 } from "lucide-react-native";

import type { ControlSize } from "@firna/ui";
import { List, ListItem } from "@firna/ui/list";
import { StatusDot, type StatusDotTone } from "@firna/ui/status-dot";
import { useSharedUiTheme } from "@firna/ui/theme";
import { TouchSurface } from "@firna/ui/touch-surface";
import { Text } from "@firna/ui/typography";

import { StoryLog, StoryScreen, StorySection, useStoryLog } from "./storyParts";

type Project = {
  id: string;
  name: string;
  status: "failed" | "live" | "paused";
  updated: string;
};

const projects: Project[] = [
  { id: "billing", name: "Billing portal", status: "live", updated: "2m" },
  { id: "emails", name: "Onboarding emails", status: "live", updated: "1h" },
  { id: "payments", name: "Payments API", status: "failed", updated: "Failed" },
  { id: "mobile", name: "Mobile app", status: "paused", updated: "Paused" },
];

const statusTone: Record<Project["status"], StatusDotTone> = {
  failed: "danger",
  live: "primary",
  paused: "neutral",
};

const changes = [
  { change: "+48 −6", folder: "src/invoices", name: "InvoiceTable.tsx" },
  { change: "+31 −2", folder: "src/invoices", name: "useInvoices.ts" },
  { change: "+6 −4", folder: "src", name: "routes.ts" },
];

/** Project rows that link to their project. The caller marks the current one. */
function ProjectRows(props: {
  current: string;
  onNavigate: (id: string) => void;
  separators?: boolean;
  size: ControlSize;
}) {
  return (
    <List
      accessibilityLabel="Projects"
      itemKey={(project) => project.id}
      itemLink={(project) => ({
        current: project.id === props.current,
        href: `/projects/${project.id}`,
      })}
      items={projects}
      onItemNavigate={(project) => props.onNavigate(project.id)}
      renderItem={(project) => (
        <ListItem
          leading={
            <StatusDot
              label={project.status === "live" ? "Live" : undefined}
              size="sm"
              tone={statusTone[project.status]}
            />
          }
          size={props.size}
          title={project.name}
          trailing={
            <Text color="muted" variant="caption">
              {project.updated}
            </Text>
          }
        />
      )}
      separators={props.separators ?? false}
      size={props.size}
    />
  );
}

/** Dense static rows: 26 px for one line, taller for two lines. */
function DenseRowsExample() {
  const theme = useSharedUiTheme();
  const glyph = <FileCode2 color={theme.colors.muted} size={14} />;
  return (
    <StoryScreen>
      <StorySection title="One line">
        <List
          accessibilityLabel="Changed files"
          itemKey={(file) => file.name}
          items={changes}
          renderItem={(file) => (
            <ListItem
              leading={glyph}
              size="xs"
              title={file.name}
              trailing={<Text variant="caption">{file.change}</Text>}
            />
          )}
          separators={false}
          size="xs"
        />
      </StorySection>
      <StorySection title="Two lines">
        <List
          accessibilityLabel="Changed files by folder"
          itemKey={(file) => file.name}
          items={changes}
          renderItem={(file) => (
            <ListItem
              description={file.folder}
              leading={glyph}
              size="xs"
              title={file.name}
            />
          )}
          separators={false}
          size="xs"
        />
      </StorySection>
    </StoryScreen>
  );
}

/** Navigation rows at the dense and the default size, and a new-tab row. */
function NavigationRowsExample() {
  const [current, setCurrent] = useState("billing");
  const log = useStoryLog();
  return (
    <StoryScreen>
      <StorySection title="Dense">
        <ProjectRows current={current} onNavigate={setCurrent} size="xs" />
      </StorySection>
      <StorySection title="Default size">
        <ProjectRows current={current} onNavigate={setCurrent} size="md" />
      </StorySection>
      <StorySection title="Outside the app">
        <List
          accessibilityLabel="Help"
          itemKey={(name) => name}
          itemLink={() => ({ href: "https://help.example.com", newTab: true })}
          items={["Help center"]}
          onItemNavigate={() => log.add("Help center")}
          renderItem={(name) => <ListItem size="xs" title={name} />}
          separators={false}
          size="xs"
        />
      </StorySection>
      <StoryLog label="Current project" text={current} />
      <StoryLog label="Last navigation" text={log.text} />
    </StoryScreen>
  );
}

/** The same navigation rows on a touch surface: 44 px for one line. */
function TouchRowsExample() {
  const [current, setCurrent] = useState("billing");
  return (
    <TouchSurface>
      <StoryScreen>
        <ProjectRows
          current={current}
          onNavigate={setCurrent}
          separators
          size="xs"
        />
        <StoryLog label="Current project" text={current} />
      </StoryScreen>
    </TouchSurface>
  );
}

const meta: Meta = { title: "List/Native rows" };

export default meta;

type Story = StoryObj;

export const DenseRows: Story = { render: () => <DenseRowsExample /> };
export const NavigationRows: Story = {
  render: () => <NavigationRowsExample />,
};
export const TouchRows: Story = { render: () => <TouchRowsExample /> };
