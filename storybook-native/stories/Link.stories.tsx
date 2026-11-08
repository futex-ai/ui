import type { Meta, StoryObj } from "@storybook/react-native";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { ChevronLeft, LifeBuoy, Settings } from "lucide-react-native";

import { LinkButton, LinkTabs, type LinkTab } from "@firna/ui/link";
import { TouchSurface } from "@firna/ui/touch-surface";

import {
  StoryLog,
  StoryRow,
  StoryScreen,
  StorySection,
  useStoryLog,
} from "./storyParts";

const tones = ["primary", "secondary", "ghost", "plain"] as const;

/** The tabs of a project. The caller marks the current page. */
function projectTabs(current: string): LinkTab[] {
  return [
    { current: current === "/atlas", href: "/atlas", label: "Overview" },
    {
      count: 43,
      current: current === "/atlas/files",
      href: "/atlas/files",
      label: "Files",
    },
    {
      current: current === "/atlas/activity",
      href: "/atlas/activity",
      label: "Activity",
    },
    {
      current: current === "/atlas/settings",
      href: "/atlas/settings",
      label: "Settings",
    },
  ];
}

/**
 * Link buttons in each tone, at the dense size, as the current page, as an
 * icon-only link, and to pages outside the app. A link with `onNavigate` runs
 * it on native. The last link has none, so the platform opens its address.
 */
function LinkButtonsExample() {
  const log = useStoryLog();
  const go = (href: string) => () => log.add(href);
  return (
    <StoryScreen>
      <StorySection title="Tones">
        <StoryRow>
          {tones.map((tone) => (
            <LinkButton
              href={`/atlas/${tone}`}
              key={tone}
              onNavigate={go(`/atlas/${tone}`)}
              tone={tone}
            >
              {`Open ${tone}`}
            </LinkButton>
          ))}
        </StoryRow>
      </StorySection>
      <StorySection title="Dense size and current page">
        <StoryRow>
          <LinkButton
            href="/atlas/activity"
            onNavigate={go("/atlas/activity")}
            size="xs"
          >
            All activity
          </LinkButton>
          <LinkButton
            current
            href="/atlas/settings"
            icon={Settings}
            onNavigate={go("/atlas/settings")}
            size="xs"
          >
            Settings
          </LinkButton>
          <LinkButton
            accessibilityLabel="Projects"
            href="/projects"
            icon={ChevronLeft}
            onNavigate={go("/projects")}
            shape="square"
            size="xs"
            tone="plain"
          />
        </StoryRow>
      </StorySection>
      <StorySection title="Outside the app">
        <StoryRow>
          <LinkButton
            href="https://help.example.com"
            icon={LifeBuoy}
            newTab
            onNavigate={go("Help center")}
            tone="plain"
          >
            Help center
          </LinkButton>
          <LinkButton href="https://example.com">Open example.com</LinkButton>
        </StoryRow>
      </StorySection>
      <StoryLog label="Last navigation" text={log.text} />
    </StoryScreen>
  );
}

/** Dense link tabs, with a count and caller label styles. */
function TabsExample() {
  const [current, setCurrent] = useState("/atlas");
  const go = (tab: LinkTab) => setCurrent(tab.href);
  return (
    <StoryScreen>
      <StorySection title="Dense tabs">
        <LinkTabs
          accessibilityLabel="Project"
          onNavigate={go}
          size="xs"
          tabs={projectTabs(current)}
        />
      </StorySection>
      <StorySection title="Capital labels">
        <LinkTabs
          accessibilityLabel="Project sections"
          labelStyle={styles.capitals}
          onNavigate={go}
          size="xs"
          tabs={projectTabs(current)}
        />
      </StorySection>
      <StoryLog label="Current page" text={current} />
    </StoryScreen>
  );
}

/** A filled tab bar and link buttons with 44 px targets on a touch surface. */
function TouchSurfaceLinksExample() {
  const [current, setCurrent] = useState("/atlas");
  const log = useStoryLog();
  return (
    <TouchSurface>
      <StoryScreen>
        <StorySection title="Filled tab bar">
          <LinkTabs
            accessibilityLabel="Project"
            fill
            onNavigate={(tab) => setCurrent(tab.href)}
            size="xs"
            tabs={projectTabs(current)}
          />
        </StorySection>
        <StorySection title="Touch link buttons">
          <LinkButton
            accessibilityLabel="Projects"
            href="/projects"
            icon={ChevronLeft}
            onNavigate={() => log.add("/projects")}
            shape="square"
            size="xs"
            tone="plain"
          />
          <LinkButton
            block
            href="/atlas/preview"
            onNavigate={() => log.add("/atlas/preview")}
            size="xs"
          >
            Open preview
          </LinkButton>
        </StorySection>
        <StoryLog label="Current page" text={current} />
        <StoryLog label="Last navigation" text={log.text} />
      </StoryScreen>
    </TouchSurface>
  );
}

const meta: Meta = { title: "Link/Native links" };

export default meta;

type Story = StoryObj;

export const LinkButtons: Story = { render: () => <LinkButtonsExample /> };
export const Tabs: Story = { render: () => <TabsExample /> };
export const TouchSurfaceLinks: Story = {
  render: () => <TouchSurfaceLinksExample />,
};

const styles = StyleSheet.create({
  capitals: { letterSpacing: 0.6, textTransform: "uppercase" },
});
