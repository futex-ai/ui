import { defineScreen } from "@mokly/mokly";

import { ProjectListScreen } from "../../../screens/ProjectListScreen";
import { projectListStateSchema } from "../../../screens/projectState";

export const choose = defineScreen({
  title: "No project open",
  description:
    "No project is open. Desktop shows the project list beside an empty state that asks for a choice. A phone shows the project list as its home screen.",
  rationale:
    "The phone list uses the same rows as the desktop list. The touch surface makes them 44 px high, with a hairline between rows.",
  relatedDocs: ["docs/protocol/app-shell-parts.md"],
  propSchema: projectListStateSchema,
  props: { list: "projects", menu: "none" },
  render: (props, context) => (
    <ProjectListScreen state={props} viewport={context.viewport} />
  ),
  variants: [
    {
      slug: "no-results",
      title: "Search without results",
      description:
        "A search matches no project. The list shows a panel empty state with Clear search.",
      props: { list: "no-results" },
    },
  ],
});
