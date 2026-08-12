import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { aspectRatioOf } from "../../src/video-editor/previewAspect";
import {
  percent,
  videoEditorSizing,
} from "../../src/video-editor/videoEditorSizing";
import { scrubAccessibility } from "../../src/timeline/timelineScrubValue";

test("a scrub position publishes whole frames on both platforms", () => {
  const scrub = scrubAccessibility(4.4, 22, 30);
  assert.deepEqual(scrub.accessibilityValue, {
    max: 660,
    min: 0,
    now: 132,
    text: "00:00:04:12",
  });
  // react-native-web drops `accessibilityValue`, so the literal ARIA props have
  // to carry the same numbers.
  assert.deepEqual(scrub.webProps, {
    "aria-valuemax": 660,
    "aria-valuemin": 0,
    "aria-valuenow": 132,
    "aria-valuetext": "00:00:04:12",
  });
});

test("a scrub position is clamped into its range", () => {
  assert.equal(scrubAccessibility(-5, 10, 30).accessibilityValue.now, 0);
  assert.equal(scrubAccessibility(99, 10, 30).accessibilityValue.now, 300);
  // A zero-length project still publishes a valid, if empty, range.
  assert.deepEqual(scrubAccessibility(0, 0, 30).accessibilityValue, {
    max: 0,
    min: 0,
    now: 0,
    text: "00:00:00:00",
  });
});

test("named aspects resolve, and an unknown one falls back to widescreen", () => {
  assert.equal(aspectRatioOf("16:9"), 16 / 9);
  assert.equal(aspectRatioOf("9:16"), 9 / 16);
  assert.equal(aspectRatioOf("1:1"), 1);
  assert.equal(aspectRatioOf(2.39), 2.39);
  assert.equal(aspectRatioOf("unknown" as "16:9"), 16 / 9);
  // A nonsense ratio would collapse the frame, so it is refused.
  assert.equal(aspectRatioOf(0), 16 / 9);
  assert.equal(aspectRatioOf(-2), 16 / 9);
});

test("percentages are emitted in the form React Native's dimensions accept", () => {
  assert.equal(percent(0.5), "50%");
  assert.equal(percent(0), "0%");
  assert.equal(percent(1), "100%");
});

test("the density scale grows monotonically across sm, md, and lg", () => {
  const keys = Object.keys(videoEditorSizing.md) as Array<
    keyof typeof videoEditorSizing.md
  >;
  for (const key of keys) {
    assert.ok(
      videoEditorSizing.sm[key] <= videoEditorSizing.md[key] &&
        videoEditorSizing.md[key] <= videoEditorSizing.lg[key],
      `${key} should not shrink as the density grows`,
    );
  }
});

test("the scrubber seeks off the responder, not off a press", () => {
  // react-native-web's press event carries no `locationX`, so a press handler
  // cannot tell where the bar was clicked — a regression here would silently
  // publish NaN positions. Guarding the shape keeps that fix from being undone.
  const source = readFileSync(
    new URL("../../src/video-editor/Scrubber.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /onStartShouldSetResponder/);
  assert.match(source, /onResponderMove/);
  assert.match(source, /Number\.isFinite\(time\)/);
  assert.doesNotMatch(source, /onPress=/);
});
