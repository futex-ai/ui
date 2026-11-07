/**
 * A persistent message in a box: a title, an optional body, an optional
 * decorative icon, and optional actions. An urgent notice is an alert that
 * assistive technology announces; a neutral notice is ordinary content.
 */
import { IconComponent } from "../primitives/icons";
import { ReactNode, useMemo } from "react";
import { StyleProp, Text, View, ViewStyle } from "../primitives/reactNative";

import { useSharedUiTheme } from "../theme";
import { useTextScale } from "../typography/textScale";

import { noticeColors, type NoticeTone } from "./noticeColors";
import { createNoticeStyles, noticeIconSize } from "./noticeStyles";
import {
  noticeAnnouncement,
  useUrgentAnnouncement,
} from "./useUrgentAnnouncement";

export type NoticeProps = {
  /**
   * Controls that act on the notice, such as a link to a log and a retry
   * button. Each stays its own control, outside the notice text. They follow
   * the text in a wide notice and go below it in a narrow one.
   */
  actions?: ReactNode;
  /**
   * The message that an urgent notice announces, in place of its title and
   * text body. Give it when the body is a node, which the library cannot
   * read, so that the whole message is announced, and again when it changes.
   * A neutral notice announces nothing.
   */
  announcementText?: string;
  /** The body. A string or number takes the body text; any node renders as-is. */
  children?: ReactNode;
  /** A decorative lucide glyph, tinted to the tone. */
  icon?: IconComponent;
  /**
   * A decorative node rendered as-is in the icon slot, such as a spinner. It
   * takes precedence over `icon`. Assistive technology does not reach it.
   */
  iconNode?: ReactNode;
  /** Extra style for the box. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the box (`data-testid` on web). */
  testID?: string;
  /** The message. It is not a heading, so the page outline stays. */
  title: string;
  /**
   * `neutral` (the default) is ordinary content. `urgent` is an alert: it
   * announces its message when it appears and when the message changes. The
   * message is `announcementText`, or the title and a text body.
   */
  tone?: NoticeTone;
};

/**
 * A notice. The tone shows as a fill and an outline on every edge. Neither
 * tone moves focus. The text follows the active text scale, so a notice on a
 * compact surface is compact too.
 */
export function Notice({
  actions,
  announcementText,
  children,
  icon: Icon,
  iconNode,
  style,
  testID,
  title,
  tone = "neutral",
}: NoticeProps) {
  const theme = useSharedUiTheme();
  const scale = useTextScale();
  const styles = useMemo(
    () => createNoticeStyles(theme, scale),
    [theme, scale],
  );
  const colors = noticeColors(theme.colors, tone);
  const urgent = tone === "urgent";
  useUrgentAnnouncement(
    urgent,
    noticeAnnouncement(title, children, announcementText),
  );
  const glyph =
    iconNode ??
    (Icon ? <Icon color={colors.icon} size={noticeIconSize(scale)} /> : null);
  return (
    <View
      // The alert role identifies the urgent notice, and its own live
      // behaviour is off: the shared announcer speaks it once, on web and
      // native alike.
      aria-live={urgent ? "off" : undefined}
      role={urgent ? "alert" : undefined}
      style={[
        styles.notice,
        { backgroundColor: colors.fill, borderColor: colors.outline },
        style,
      ]}
      testID={testID}
    >
      {glyph != null ? (
        <View aria-hidden pointerEvents="none" style={styles.icon}>
          {glyph}
        </View>
      ) : null}
      <View style={styles.content}>
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.title }]}>{title}</Text>
          {typeof children === "string" || typeof children === "number" ? (
            <Text style={[styles.body, { color: colors.body }]}>
              {children}
            </Text>
          ) : (
            (children ?? null)
          )}
        </View>
        {actions != null ? <View style={styles.actions}>{actions}</View> : null}
      </View>
    </View>
  );
}
