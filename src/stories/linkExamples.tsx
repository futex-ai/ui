/**
 * The examples of the link stories: link buttons, link tabs, and both on a
 * touch surface. Each example shows the last app navigation in text, so a
 * plain click is visible without leaving the story.
 */
import { ChevronLeft, Info, Settings } from "../primitives/icons";
import { useState } from "react";
import { StyleSheet, View } from "../primitives/reactNative";

import { Button, Caption } from "../index";
import { LinkButton, LinkTabs, type LinkTab } from "../link";
import { TouchSurface } from "../touchSurface";

/** Every destination that the app navigated to, in order. */
function useNavigation() {
  const [log, setLog] = useState<string[]>([]);
  return {
    go: (href: string) => () => setLog((current) => [...current, href]),
    last: log.length === 0 ? "none" : log.join(", "),
  };
}

const tones = ["primary", "secondary", "ghost", "plain"] as const;

const projectTabs = (current: string): LinkTab[] => [
  { current: current === "overview", href: "/atlas", label: "Overview" },
  {
    count: 43,
    current: current === "files",
    href: "/atlas/files",
    label: "Files",
  },
  {
    current: current === "activity",
    href: "/atlas/activity",
    label: "Activity",
  },
  {
    current: current === "deployments",
    href: "/atlas/deployments",
    label: "Deployments",
  },
  {
    current: current === "settings",
    href: "/atlas/settings",
    label: "Settings",
  },
];

/** Link buttons in every tone, the dense size, a current page, and a new tab. */
export function LinkButtonsExample() {
  const navigation = useNavigation();
  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        {tones.map((tone) => (
          <LinkButton
            href={`/atlas/${tone}`}
            key={tone}
            onNavigate={navigation.go(`/atlas/${tone}`)}
            tone={tone}
          >
            {`Open ${tone}`}
          </LinkButton>
        ))}
      </View>
      <View style={styles.row}>
        <LinkButton
          href="/atlas/activity"
          onNavigate={navigation.go("/atlas/activity")}
          size="xs"
        >
          All activity
        </LinkButton>
        <LinkButton
          current
          href="/atlas/settings"
          icon={Settings}
          onNavigate={navigation.go("/atlas/settings")}
          size="xs"
          tone="ghost"
        >
          Settings
        </LinkButton>
        <LinkButton
          href="https://help.example.com/deploys"
          icon={Info}
          newTab
          onNavigate={navigation.go("https://help.example.com/deploys")}
          size="xs"
          tone="plain"
        >
          Help center
        </LinkButton>
        <LinkButton
          accessibilityLabel="Projects"
          href="/projects"
          icon={ChevronLeft}
          onNavigate={navigation.go("/projects")}
          shape="square"
          size="xs"
          tone="plain"
        />
      </View>
      <View style={styles.sidebar}>
        <LinkButton
          block
          href="https://docs.example.com"
          icon={Info}
          labelStyle={styles.startLabel}
          newTab
          size="xs"
          style={styles.start}
          tone="plain"
        >
          Documentation
        </LinkButton>
      </View>
      <Caption>{`Navigations: ${navigation.last}`}</Caption>
    </View>
  );
}

/** Each link button beside the button of the same tone and size. */
export function LinkBesideButtonsExample() {
  return (
    <View style={styles.stack}>
      {(["xs", "md"] as const).map((size) => (
        <View key={size} style={styles.row}>
          {tones.map((tone) => (
            <View key={tone} style={styles.pair}>
              <Button onPress={() => undefined} size={size} tone={tone}>
                {`Button ${tone} ${size}`}
              </Button>
              <LinkButton
                href={`/${tone}`}
                onNavigate={() => undefined}
                size={size}
                tone={tone}
              >
                {`Link ${tone} ${size}`}
              </LinkButton>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Dense desktop tabs that scroll in a narrow column, and restyled labels. */
export function LinkTabsExample() {
  const navigation = useNavigation();
  return (
    <View style={styles.stack}>
      <View style={styles.narrow}>
        <LinkTabs
          accessibilityLabel="Project"
          onNavigate={(tab) => navigation.go(tab.href)()}
          size="xs"
          tabs={projectTabs("files")}
        />
      </View>
      <LinkTabs
        accessibilityLabel="Workspace"
        labelStyle={styles.graphite}
        onNavigate={(tab) => navigation.go(tab.href)()}
        size="xs"
        tabs={[
          { current: true, href: "/runs", label: "Runs" },
          { href: "/agents", label: "Agents" },
          {
            href: "https://status.example.com",
            label: "Status",
            newTab: true,
          },
        ]}
      />
      <LinkTabs
        accessibilityLabel="Sections"
        onNavigate={(tab) => navigation.go(tab.href)()}
        tabs={projectTabs("overview").slice(0, 3)}
      />
      <Caption>{`Navigations: ${navigation.last}`}</Caption>
    </View>
  );
}

/** Link buttons and a filled tab bar on a touch surface, as on a phone. */
export function LinkTouchExample() {
  const navigation = useNavigation();
  return (
    <TouchSurface>
      <View style={styles.phone}>
        <View style={styles.row}>
          <LinkButton
            accessibilityLabel="Projects"
            href="/projects"
            icon={ChevronLeft}
            onNavigate={navigation.go("/projects")}
            shape="square"
            size="xs"
            tone="plain"
          />
          <LinkButton
            href="/atlas/activity"
            onNavigate={navigation.go("/atlas/activity")}
            size="xs"
          >
            All activity
          </LinkButton>
        </View>
        <LinkTabs
          accessibilityLabel="Project"
          fill
          onNavigate={(tab) => navigation.go(tab.href)()}
          size="xs"
          tabs={projectTabs("files").filter(
            (tab) => tab.label !== "Deployments",
          )}
        />
        {/* A narrow filled bar with more tabs than fit: each tab keeps its 44px
            target, and the bar scrolls. */}
        <View style={styles.narrowPhone}>
          <LinkTabs
            accessibilityLabel="Quarter"
            fill
            onNavigate={(tab) => navigation.go(tab.href)()}
            size="xs"
            tabs={["Q1", "Q2", "Q3", "Q4", "Year", "Archive"].map((label) => ({
              current: label === "Q2",
              href: `/reports/${label.toLowerCase()}`,
              label,
            }))}
          />
        </View>
        <Caption>{`Navigations: ${navigation.last}`}</Caption>
      </View>
    </TouchSurface>
  );
}

const styles = StyleSheet.create({
  graphite: {
    fontFamily: "JetBrains Mono, ui-monospace, monospace",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  narrow: { width: 240 },
  narrowPhone: { width: 240 },
  pair: { alignItems: "flex-start", gap: 6 },
  phone: { gap: 12, width: 360 },
  row: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sidebar: { width: 232 },
  stack: { gap: 16 },
  start: { justifyContent: "flex-start" },
  startLabel: { flex: 1 },
});
