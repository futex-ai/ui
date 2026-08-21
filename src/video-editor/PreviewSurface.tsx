/**
 * The program monitor's frame.
 *
 * Chrome only: it letterboxes an aspect-correct box and hands the inside of it
 * to whatever the consumer passes as children — a web `<video>`, `expo-video`,
 * a canvas, a poster image. Nothing here touches a media API, so the library
 * gains no runtime dependency and stays as useful for a storyboard tool as for
 * a player.
 *
 * The composition guides (rule of thirds, action- and title-safe areas, centre
 * cross) are drawn over the frame and hidden from assistive tech: they are a
 * sighted-framing aid with no textual meaning.
 */
import type { ReactNode } from "react";
import { useMemo } from "react";
import { type StyleProp, Text, View, type ViewStyle } from "react-native";

import { useSharedUiTheme } from "../theme";

import {
  aspectRatioOf,
  type PreviewAspect,
  SAFE_INSETS,
} from "./previewAspect";
import { percent } from "./videoEditorSizing";
import { createVideoEditorStyles } from "./videoEditorStyles";

export type PreviewSurfaceProps = {
  /** Frame shape. Default `"16:9"`. */
  aspect?: PreviewAspect;
  /** The player. Anything rendered here fills the frame. */
  children?: ReactNode;
  /** Drawn above the player — transform handles, captions, a title overlay. */
  overlay?: ReactNode;
  /** Rule-of-thirds grid. Default `false`. */
  showThirds?: boolean;
  /** Action-safe and title-safe rectangles. Default `false`. */
  showSafeAreas?: boolean;
  /** Centre cross. Default `false`. */
  showCenter?: boolean;
  /** Corner caption, e.g. `"1920×1080 · 30fps"`. */
  badge?: string;
  /** Shown when no children are supplied. */
  placeholder?: string;
  /** Caps the frame's height so a tall aspect cannot run away vertically. */
  maxHeight?: number;
  /** Names the monitor as a region for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function PreviewSurface({
  accessibilityLabel,
  aspect = "16:9",
  badge,
  children,
  maxHeight,
  overlay,
  placeholder = "No preview",
  showCenter = false,
  showSafeAreas = false,
  showThirds = false,
  style,
  testID,
}: PreviewSurfaceProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createVideoEditorStyles(theme), [theme]);
  const ratio = aspectRatioOf(aspect);

  return (
    <View
      aria-label={accessibilityLabel}
      role={accessibilityLabel ? "group" : undefined}
      style={[styles.letterbox, maxHeight ? { maxHeight } : null, style]}
      testID={testID}
    >
      <View
        style={[
          styles.frame,
          { aspectRatio: ratio },
          maxHeight ? { maxHeight, maxWidth: maxHeight * ratio } : null,
        ]}
      >
        {children ?? (
          <View style={styles.previewPlaceholder}>
            <Text style={styles.previewPlaceholderText}>{placeholder}</Text>
          </View>
        )}
        {overlay}
        {showThirds ? <ThirdsGuide styles={styles} /> : null}
        {showSafeAreas ? <SafeAreaGuide styles={styles} /> : null}
        {showCenter ? <CenterGuide styles={styles} /> : null}
        {badge ? (
          <View style={[styles.previewBadge, { bottom: 6, right: 6 }]}>
            <Text style={styles.previewBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

type Styles = ReturnType<typeof createVideoEditorStyles>;

function ThirdsGuide({ styles }: { styles: Styles }) {
  return (
    <View aria-hidden pointerEvents="none" style={styles.frameFill}>
      {[1 / 3, 2 / 3].map((offset) => (
        <View
          key={`v-${offset}`}
          style={[
            styles.guideLine,
            { bottom: 0, left: percent(offset), top: 0, width: 1 },
          ]}
        />
      ))}
      {[1 / 3, 2 / 3].map((offset) => (
        <View
          key={`h-${offset}`}
          style={[
            styles.guideLine,
            { height: 1, left: 0, right: 0, top: percent(offset) },
          ]}
        />
      ))}
    </View>
  );
}

function SafeAreaGuide({ styles }: { styles: Styles }) {
  return (
    <View aria-hidden pointerEvents="none" style={styles.frameFill}>
      {[SAFE_INSETS.action, SAFE_INSETS.title].map((inset) => {
        const edge = percent(inset);
        return (
          <View
            key={inset}
            style={[
              styles.safeArea,
              { bottom: edge, left: edge, right: edge, top: edge },
            ]}
          />
        );
      })}
    </View>
  );
}

function CenterGuide({ styles }: { styles: Styles }) {
  return (
    <View aria-hidden pointerEvents="none" style={styles.frameFill}>
      <View
        style={[
          styles.guideLine,
          {
            height: 1,
            left: percent(0.48),
            right: percent(0.48),
            top: percent(0.5),
          },
        ]}
      />
      <View
        style={[
          styles.guideLine,
          {
            bottom: percent(0.48),
            left: percent(0.5),
            top: percent(0.48),
            width: 1,
          },
        ]}
      />
    </View>
  );
}
