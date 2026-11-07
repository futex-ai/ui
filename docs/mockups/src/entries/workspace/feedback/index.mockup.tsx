import { defineScreen } from "@mokly/mokly";

import { ProjectScreen } from "../../../screens/ProjectScreen";
import {
  projectAtRest,
  projectStateSchema,
} from "../../../screens/projectState";

export const feedback = defineScreen({
  title: "Notices and empty states",
  description:
    "A deploy runs. A neutral notice says so above the overview, with a link to the log, and Deploy shows its progress.",
  rationale:
    "Both notice tones have a full outline and a tinted fill. No edge has an accent strip. A neutral notice is not a live region. Its icon slot takes any node, here a spinner. On a phone the actions move under the text.",
  relatedDocs: [],
  propSchema: projectStateSchema,
  props: { ...projectAtRest, deploy: "running" },
  render: (props, context) => (
    <ProjectScreen state={props} viewport={context.viewport} />
  ),
  variants: [
    {
      slug: "failed",
      title: "Urgent notice",
      description:
        "The deploy failed. An urgent notice names the failure, says what still works, and offers Try again.",
      rationale:
        "An urgent notice is an alert, so a screen reader announces it when it appears. Its rose tint and outline carry the tone, and its title and body keep the ink colours.",
      props: { deploy: "failed" },
    },
    {
      slug: "new-project",
      title: "Empty files and changes",
      description:
        "A new project has no files and no changes yet. The Files tab shows a page empty state with the next steps. The changes panel shows a smaller panel empty state.",
      rationale:
        "The title of an empty state is a heading at the level that the caller gives. A page empty state centres in its area. A panel empty state sits at the top of its panel.",
      props: { tab: "files", content: "new", deploy: "live" },
    },
  ],
});
