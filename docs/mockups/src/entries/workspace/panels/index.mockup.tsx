import { defineScreen } from "@mokly/mokly";

import { ProjectScreen } from "../../../screens/ProjectScreen";
import {
  projectAtRest,
  projectStateSchema,
} from "../../../screens/projectState";

export const panels = defineScreen({
  title: "Panel resizing",
  description:
    "The pointer is over the inner edge of the project list. The hairline darkens and a grip shows in its middle. A phone has no columns to resize.",
  rationale:
    "Each handle is a window splitter: a focusable separator with a name, the current width, and its bounds. The project list starts at 232 px and resizes from 200 to 360 px. The changes panel starts at 340 px and resizes from 280 to 520 px. An arrow key changes a width by 16 px. The primary colour shows only on the short grip, so no panel gets an accent edge. The caller owns the widths and stores them.",
  relatedDocs: [],
  propSchema: projectStateSchema,
  props: { ...projectAtRest, resize: "sidebar-hover" },
  render: (props, context) => (
    <ProjectScreen state={props} viewport={context.viewport} />
  ),
  variants: [
    {
      slug: "dragging",
      title: "Dragging",
      description:
        "The user drags the handle of the changes panel, which is now 452 px wide. The main column narrows.",
      props: { resize: "detail-drag" },
    },
    {
      slug: "keyboard",
      title: "Keyboard focus at the minimum",
      description:
        "Keyboard focus is on the handle of the project list, which arrow keys moved to its minimum width of 200 px. The grip shows with the library focus glow.",
      props: { resize: "sidebar-keyboard" },
    },
  ],
});
