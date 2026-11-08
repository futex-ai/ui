import { defineScreen } from "@mokly/mokly";

import { ProjectScreen } from "../../../screens/ProjectScreen";
import {
  projectAtRest,
  projectStateSchema,
} from "../../../screens/projectState";

export const density = defineScreen({
  title: "Dense controls and text",
  description:
    "The project settings: a dense form on desktop and a touch form on a phone, with text fields, selectors, a segmented control, a switch, and buttons.",
  rationale:
    "Fields, selectors, and the segmented track are 26 px, as high as the xs buttons, so a form row or a toolbar keeps one line. The switch has no xs size and uses its sm size. Field text is 13 px on desktop. On a phone it is 16 px, which stops a phone browser from zooming into a focused field. Labels, hints, and errors use the compact type scale on desktop.",
  relatedDocs: ["docs/protocol/app-shell-parts.md"],
  propSchema: projectStateSchema,
  props: { ...projectAtRest, tab: "settings" },
  render: (props, context) => (
    <ProjectScreen state={props} viewport={context.viewport} />
  ),
  variants: [
    {
      slug: "invalid",
      title: "Field error and member view",
      description:
        "Save found an empty name, so the field shows its error and keeps keyboard focus. The viewer is a member, so Archive is unavailable and says who can archive.",
      rationale:
        "The 4 px focus glow and the error outline fit in the gap between dense form rows. A disabled xs button keeps the label weight and dims to 55%.",
      props: { form: "invalid" },
    },
  ],
});
