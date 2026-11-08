/**
 * The decorative placeholder items of a busy {@link List}. Each item mirrors
 * the {@link ListItem} anatomy (a leading circle, title and description bars,
 * and a trailing chip), and all of them share one pulse. A dense list mirrors
 * its single-line rows instead: one title bar and a short trailing bar, so a
 * placeholder is as high as a row.
 */
import { Fragment, ReactNode } from "react";
import { View } from "../primitives/reactNative";

import {
  SkeletonBar,
  SkeletonCircle,
  SkeletonPulseProvider,
} from "../skeleton";

import type { ListStyles } from "./listStyles";

/** Leading-circle diameter for a skeleton item, matching a typical list avatar. */
const SKELETON_AVATAR_DIAMETER = 40;
/** Title / description placeholder widths cycled by item index for natural variety. */
const SKELETON_TITLE_WIDTHS = ["48%", "62%", "40%"] as const;
const SKELETON_DESCRIPTION_WIDTHS = ["82%", "70%", "90%"] as const;

export function ListSkeletonItems({
  dense,
  loadingItemCount,
  separator,
  styles,
}: {
  /** Draw single-line placeholders for the dense `xs` rows. */
  dense: boolean;
  /** How many placeholder items to draw. */
  loadingItemCount: number;
  /** The divider between two items, or `null` for none. Never after the last. */
  separator: ReactNode;
  styles: ListStyles;
}) {
  return (
    <SkeletonPulseProvider>
      {Array.from({ length: loadingItemCount }).map((_, index) => {
        const last = index === loadingItemCount - 1;
        return (
          <Fragment key={`skeleton-${index}`}>
            <View aria-hidden style={styles.item}>
              {dense ? (
                <DenseSkeletonRow index={index} styles={styles} />
              ) : (
                <View style={styles.itemRow}>
                  <View style={styles.itemLeading}>
                    <SkeletonCircle diameter={SKELETON_AVATAR_DIAMETER} />
                  </View>
                  <View style={styles.itemMain}>
                    <SkeletonBar
                      height={14}
                      width={
                        SKELETON_TITLE_WIDTHS[
                          index % SKELETON_TITLE_WIDTHS.length
                        ]
                      }
                    />
                    <SkeletonBar
                      height={11}
                      width={
                        SKELETON_DESCRIPTION_WIDTHS[
                          index % SKELETON_DESCRIPTION_WIDTHS.length
                        ]
                      }
                    />
                  </View>
                  <View style={styles.itemTrailing}>
                    <SkeletonBar height={12} radius="pill" width={56} />
                  </View>
                </View>
              )}
            </View>
            {!last ? separator : null}
          </Fragment>
        );
      })}
    </SkeletonPulseProvider>
  );
}

/** A single-line placeholder: a title bar and a short trailing bar. */
function DenseSkeletonRow({
  index,
  styles,
}: {
  index: number;
  styles: ListStyles;
}) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemMain}>
        <SkeletonBar
          height={10}
          width={SKELETON_TITLE_WIDTHS[index % SKELETON_TITLE_WIDTHS.length]}
        />
      </View>
      <View style={styles.itemTrailing}>
        <SkeletonBar height={10} radius="pill" width={24} />
      </View>
    </View>
  );
}
