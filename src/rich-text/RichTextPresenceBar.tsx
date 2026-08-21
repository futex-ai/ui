/** Who is live in a rich-text document, as a stack of tinted avatar discs. */
import { useMemo } from "react";
import { Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { Avatar } from "../avatar";
import { useSharedUiTheme } from "../theme";

import { richTextCollabPalette } from "./richTextCollabPalette";
import { richTextPresenceSummary } from "./richTextCollabRailModel";
import { createRichTextCollabStyles } from "./richTextCollabStyles";
import type {
  RichTextCollaborator,
  RichTextPresence,
} from "./richTextCollabTypes";

export type RichTextPresenceBarProps = {
  /** Everyone who can appear, in the order their colours are assigned. */
  collaborators: readonly RichTextCollaborator[];
  /**
   * The viewer, who is left out of both the discs and the summary — the bar
   * answers "who else is here", not "who is here".
   */
  localCollaboratorId?: string;
  /** Diameter of each disc in px. */
  size?: number;
  /** Live carets, the same array the editor is given. */
  presence: readonly RichTextPresence[];
  /** Extra style for the row. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/**
 * A compact live-presence row: one disc per collaborator in that person's
 * editor colour, followed by a sentence naming them. The sentence is what
 * carries the meaning — the discs repeat the caret colours so a reader can tie
 * a caret in the text back to a name, but nothing here depends on colour alone
 * (WCAG 2.1 — 1.4.1 Use of Color).
 */
export function RichTextPresenceBar({
  collaborators,
  localCollaboratorId,
  size = 24,
  presence,
  style,
  testID,
}: RichTextPresenceBarProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createRichTextCollabStyles(theme), [theme]);
  const palette = useMemo(
    () => richTextCollabPalette(theme, collaborators),
    [collaborators, theme],
  );

  const live = useMemo(() => {
    const seen = new Set<string>();
    return presence
      .map((entry) => entry.collaboratorId)
      .filter((id) => {
        if (id === localCollaboratorId || seen.has(id)) return false;
        seen.add(id);
        return palette.has(id);
      });
  }, [localCollaboratorId, palette, presence]);

  const summary = richTextPresenceSummary(
    live.map((id) => palette.get(id)?.name ?? id),
  );

  return (
    <View style={[styles.presenceBar, style]} testID={testID}>
      {live.length === 0 ? null : (
        <View style={styles.avatarStack}>
          {live.map((id, index) => {
            const collaborator = palette.get(id);
            return (
              <Avatar
                // The summary beside the stack already names everyone, so the
                // discs stay decorative rather than repeating each name.
                decorative
                key={id}
                label={collaborator?.initials ?? "?"}
                size={size}
                style={[
                  styles.avatarRing,
                  { backgroundColor: collaborator?.accent },
                  index > 0 ? styles.avatarStacked : null,
                ]}
                textColor={collaborator?.onAccent}
              />
            );
          })}
        </View>
      )}
      <Text style={styles.presenceSummary}>{summary}</Text>
    </View>
  );
}
