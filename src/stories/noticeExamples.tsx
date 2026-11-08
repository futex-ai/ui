/**
 * The examples of the notice stories: both tones, a narrow notice whose
 * actions wrap below its text, a compact surface, and an urgent notice whose
 * message can change, to show when it announces.
 */
import { CircleAlert } from "../primitives/icons";
import { StrictMode, useState } from "react";
import { StyleSheet, View } from "../primitives/reactNative";

import {
  Body,
  Button,
  Caption,
  Spinner,
  TextScaleProvider,
  useSharedUiTheme,
} from "../index";
import { LinkButton } from "../link";
import { Notice } from "../notice";

/** The story stays on its page when a link in it is followed. */
const stay = () => undefined;

/** A neutral notice of a deploy in progress, with a spinner and a link. */
function DeployingNotice() {
  const theme = useSharedUiTheme();
  return (
    <Notice
      actions={
        <LinkButton
          href="/atlas/activity"
          onNavigate={stay}
          size="xs"
          tone="plain"
        >
          View log
        </LinkButton>
      }
      iconNode={<Spinner color={theme.colors.muted} size={14} />}
      testID="deploying-notice"
      title="Deploying to production"
    >
      The live site updates when the deploy finishes.
    </Notice>
  );
}

/** An urgent notice of a failed deploy, with a link and a retry button. */
function FailedNotice({ step = "the test step" }: { step?: string }) {
  return (
    <Notice
      actions={
        <>
          <LinkButton
            href="/atlas/activity"
            onNavigate={stay}
            size="xs"
            tone="plain"
          >
            View log
          </LinkButton>
          <Button onPress={stay} size="xs">
            Try again
          </Button>
        </>
      }
      icon={CircleAlert}
      testID="failed-notice"
      title="The deploy failed"
      tone="urgent"
    >
      {`The build stopped at ${step}. The live site still runs the last good deploy.`}
    </Notice>
  );
}

/** A neutral and an urgent notice at full width. */
export function NoticeTonesExample() {
  return (
    <View style={styles.wide}>
      <DeployingNotice />
      <FailedNotice />
    </View>
  );
}

/** The same notices in a narrow column: the actions go below the text. */
export function NoticeNarrowExample() {
  return (
    <View style={styles.narrow}>
      <DeployingNotice />
      <FailedNotice />
    </View>
  );
}

/** Notices on a compact surface take the compact body text. */
export function NoticeCompactExample() {
  return (
    <TextScaleProvider scale="compact">
      <View style={styles.wide}>
        <DeployingNotice />
        <FailedNotice />
      </View>
    </TextScaleProvider>
  );
}

const steps = ["the test step", "the build step"];
const checks = ["Unit tests", "Type check"];

/** The other of two values. */
function other<T>(values: readonly [T, T], current: T): T {
  return current === values[0] ? values[1] : values[0];
}

/**
 * Failed checks: a body node that the library cannot read, so the caller
 * gives the full message to announce.
 */
function ChecksNotice({ check }: { check: string }) {
  return (
    <Notice
      announcementText={`Checks failed. ${check} did not pass.`}
      icon={CircleAlert}
      title="Checks failed"
      tone="urgent"
    >
      <Body color="secondary">
        <Body color="secondary" style={styles.strong}>
          {check}
        </Body>
        {" did not pass."}
      </Body>
    </Notice>
  );
}

type DeployState = "idle" | "running" | "failed" | "checks";

/**
 * Notices that appear and change on request. An urgent notice announces when
 * it appears and when its message changes, and not when it re-renders with
 * the same message. A neutral notice never announces. The example runs in
 * React's StrictMode, which mounts each effect twice in development, as many
 * apps do.
 */
export function NoticeAnnouncementExample() {
  return (
    <StrictMode>
      <NoticeAnnouncements />
    </StrictMode>
  );
}

function NoticeAnnouncements() {
  const [deploy, setDeploy] = useState<DeployState>("idle");
  const [step, setStep] = useState(steps[0]);
  const [check, setCheck] = useState(checks[0]);
  const [refreshes, setRefreshes] = useState(0);
  return (
    <View style={styles.wide}>
      <View style={styles.row}>
        <Button onPress={() => setDeploy("running")} size="xs">
          Start a deploy
        </Button>
        <Button onPress={() => setDeploy("failed")} size="xs">
          Fail the deploy
        </Button>
        <Button
          onPress={() =>
            setStep((current) => other([steps[0], steps[1]], current))
          }
          size="xs"
        >
          Change the failed step
        </Button>
        <Button onPress={() => setDeploy("checks")} size="xs">
          Fail the checks
        </Button>
        <Button
          onPress={() =>
            setCheck((current) => other([checks[0], checks[1]], current))
          }
          size="xs"
        >
          Change the failed check
        </Button>
        <Button onPress={() => setRefreshes((count) => count + 1)} size="xs">
          Refresh
        </Button>
        <Button onPress={() => setDeploy("idle")} size="xs">
          Clear
        </Button>
      </View>
      <Caption>{`Refreshes: ${refreshes}`}</Caption>
      {deploy === "running" ? <DeployingNotice /> : null}
      {deploy === "failed" ? <FailedNotice step={step} /> : null}
      {deploy === "checks" ? <ChecksNotice check={check} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  narrow: { gap: 12, width: 300 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  strong: { fontWeight: "600" },
  wide: { gap: 12, width: 560 },
});
