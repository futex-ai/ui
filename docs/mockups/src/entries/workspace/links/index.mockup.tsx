import { defineScreen } from "@mokly/mokly";

import { ProjectScreen } from "../../../screens/ProjectScreen";
import {
  projectAtRest,
  projectStateSchema,
} from "../../../screens/projectState";

export const links = defineScreen({
  title: "Link buttons and link tabs",
  description:
    "The Files tab is the current page. Each tab is a link with its own address. Open preview and Help center are link buttons to pages outside the app, and All activity and Clear search are link buttons inside it.",
  rationale:
    "LinkTabs is a navigation landmark. The current tab carries aria-current=page and has a control edge, a soft fill, and ink text, so its state does not depend on colour alone. A link button is a real anchor with the look of a button, so a user can open it in a new tab or copy its address. A link to a page outside the app ends with an arrow and tells assistive technology that it opens a new tab. On a phone the tabs share the width of the bar and are 44 px high.",
  relatedDocs: [],
  propSchema: projectStateSchema,
  props: { ...projectAtRest, tab: "files" },
  render: (props, context) => (
    <ProjectScreen state={props} viewport={context.viewport} />
  ),
  variants: [
    {
      slug: "activity",
      title: "Activity tab",
      description:
        "The Activity tab is the current page. Its two-line rows grow past the 26 px of a single-line row.",
      props: { tab: "activity" },
    },
    {
      slug: "keyboard",
      title: "Keyboard focus on a tab",
      description:
        "Keyboard focus is on the Files tab, and the Overview tab is the current page. The tab shows the library focus glow.",
      props: { tab: "overview", focus: "files-tab" },
    },
  ],
});
