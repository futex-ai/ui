import { Spinner } from "@firna/ui/spinner";
import { useSharedUiTheme } from "@firna/ui/theme";
import { OctagonAlert } from "lucide-react";

import { useRowMetrics } from "../components/common/Surface";
import { ActionButton } from "../components/parts/Action";
import { LinkButton } from "../components/parts/LinkButton";
import { Notice } from "../components/parts/Notice";
import { paths } from "../paths";
import type { DeployState } from "./projectState";

/**
 * The notice of the last deploy: a neutral notice while it runs, and an
 * urgent notice when it fails. A live project shows none.
 */
export function DeployNotice(props: { deploy: DeployState }) {
  const theme = useSharedUiTheme();
  const metrics = useRowMetrics();
  switch (props.deploy) {
    case "live":
      return null;
    case "running":
      return (
        <Notice
          actions={
            <LinkButton tone="plain" to={paths.activity}>
              View log
            </LinkButton>
          }
          icon={<Spinner color={theme.colors.muted} size={metrics.iconSize} />}
          title="Deploying to production"
        >
          The live site updates when the deploy finishes.
        </Notice>
      );
    case "failed":
      return (
        <Notice
          actions={
            <>
              <LinkButton tone="plain" to={paths.activity}>
                View log
              </LinkButton>
              <ActionButton to={paths.deployRunning}>Try again</ActionButton>
            </>
          }
          icon={<OctagonAlert size={metrics.iconSize + 2} />}
          title="The deploy failed"
          tone="urgent"
        >
          The build stopped at the test step. The live site still runs the last
          good deploy.
        </Notice>
      );
  }
}
