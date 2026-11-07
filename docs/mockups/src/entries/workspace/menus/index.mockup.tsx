import { defineScreen } from "@mokly/mokly";

import { ProjectScreen } from "../../../screens/ProjectScreen";
import {
  projectAtRest,
  projectStateSchema,
} from "../../../screens/projectState";

export const menus = defineScreen({
  title: "Menus",
  description:
    "The project menu is open. Desktop draws the dense menu beside its trigger, with the first row active. A phone opens the same actions in a sheet.",
  rationale:
    "The menu draws open in the page for a static view, without a portal or a measurement. Its rows are 26 px on desktop and 44 px in the phone sheet. They keep the anatomy of the library dropdown list: an icon, a label, a divider, a danger row, and the solid highlight of the active row. The sheet keeps the anatomy of the library sheet: a grip, a title, and a close button, which a touch surface makes 44 px.",
  relatedDocs: [],
  propSchema: projectStateSchema,
  props: { ...projectAtRest, menu: "actions" },
  render: (props, context) => (
    <ProjectScreen state={props} viewport={context.viewport} />
  ),
});
