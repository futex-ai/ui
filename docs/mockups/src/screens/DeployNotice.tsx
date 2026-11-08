import { mockLink } from "@mokly/mokly";
import { OctagonAlert } from "lucide-react";
import { LinkButton } from "@firna/ui/link";
import { Notice } from "@firna/ui/notice";
import { Spinner } from "@firna/ui/spinner";
import { useSharedUiTheme } from "@firna/ui/theme";
import { useTextScale } from "@firna/ui/typography";

import { ActionButton } from "../components/parts/Action";
import { paths } from "../paths";
import type { DeployState } from "./projectState";

/** View log, an app link to the activity of the project. */
function ViewLog() {
  return (
    <LinkButton href={mockLink(paths.activity)} size="xs" tone="plain">
      View log
    </LinkButton>
  );
}

/**
 * The notice of the last deploy: a neutral notice while it runs, and an
 * urgent notice when it fails. A live project shows none.
 */
export function DeployNotice(props: { deploy: DeployState }) {
  const theme = useSharedUiTheme();
  // The spinner takes the size of the notice glyphs of the text scale.
  const glyph = useTextScale() === "compact" ? 16 : 18;
  switch (props.deploy) {
    case "live":
      return null;
    case "running":
      return (
        <Notice
          actions={<ViewLog />}
          iconNode={<Spinner color={theme.colors.muted} size={glyph} />}
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
              <ViewLog />
              <ActionButton to={paths.deployRunning}>Try again</ActionButton>
            </>
          }
          icon={OctagonAlert}
          title="The deploy failed"
          tone="urgent"
        >
          The build stopped at the test step. The live site still runs the last
          good deploy.
        </Notice>
      );
  }
}
