import type { Meta, StoryObj } from "@storybook/react-vite";

import { darkSharedUiTheme } from "../index";
import {
  NoticeAnnouncementExample,
  NoticeCompactExample,
  NoticeNarrowExample,
  NoticeTonesExample,
} from "./noticeExamples";
import { StorySurface } from "./sharedExamples";

const meta = {
  title: "Notice/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A neutral notice with a spinner and a link, and an urgent notice with an
 * icon, a link, and a button. The tone is a fill and a full outline.
 */
export const Tones: Story = {
  name: "Tones",
  render: () => (
    <StorySurface>
      <NoticeTonesExample />
    </StorySurface>
  ),
};

/** In a narrow column the actions go below the text. */
export const Narrow: Story = {
  name: "Narrow",
  render: () => (
    <StorySurface>
      <NoticeNarrowExample />
    </StorySurface>
  ),
};

/** On a compact surface the notice text is the compact body text. */
export const Compact: Story = {
  name: "Compact text",
  render: () => (
    <StorySurface>
      <NoticeCompactExample />
    </StorySurface>
  ),
};

/**
 * An urgent notice announces its message when it appears and when the
 * message changes, and not when it re-renders with the same message.
 */
export const Announcement: Story = {
  name: "Urgent announcement",
  render: () => (
    <StorySurface>
      <NoticeAnnouncementExample />
    </StorySurface>
  ),
};

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <NoticeTonesExample />
    </StorySurface>
  ),
};
