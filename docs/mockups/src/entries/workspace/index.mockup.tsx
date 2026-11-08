import { defineScreen } from "@mokly/mokly";

import { ProjectScreen } from "../../screens/ProjectScreen";
import { projectAtRest, projectStateSchema } from "../../screens/projectState";

export const workspace = defineScreen({
  title: "Project workspace",
  description:
    "A project at rest. Desktop shows the project list, the project with its tabs, and the changes panel. A phone shows the project page alone. Every new part is here at rest. The child pages show their states.",
  rationale:
    "Desktop marks a dense surface: xs controls are 26 px with 12 px medium labels, single-line rows are 26 px, and text uses the compact scale with a 13 px body. The phone marks a touch surface: controls, tabs, and rows are at least 44 px, fields use 16 px text, and text keeps the default scale. A screen marks its surface. Nothing reads the width of the viewport. The parts read only theme tokens, so they follow the light and dark themes.",
  relatedDocs: ["docs/protocol/app-shell-parts.md"],
  propSchema: projectStateSchema,
  props: projectAtRest,
  render: (props, context) => (
    <ProjectScreen state={props} viewport={context.viewport} />
  ),
});
