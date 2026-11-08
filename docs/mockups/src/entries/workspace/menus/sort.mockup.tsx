import { defineScreen } from "@mokly/mokly";

import { ProjectListScreen } from "../../../screens/ProjectListScreen";
import { projectListStateSchema } from "../../../screens/projectState";

export const sort = defineScreen({
  title: "Menu of choices",
  description:
    "The sort menu of the project list is open. It holds one choice in a group, with a group label, a muted detail, and a note under the choices.",
  rationale:
    "Each choice is a menu item radio. The current choice has a check, so its state does not depend on colour alone. The desktop menu opens with the current choice active.",
  relatedDocs: ["docs/protocol/app-shell-parts.md"],
  propSchema: projectListStateSchema,
  props: { list: "projects", menu: "sort" },
  render: (props, context) => (
    <ProjectListScreen state={props} viewport={context.viewport} />
  ),
});
