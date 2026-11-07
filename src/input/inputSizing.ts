/**
 * The geometry of the framed input at each size and on a touch surface: the
 * box and input heights, the gaps and padding, the type scale, the icon and
 * action sizes, and the textarea lines. The field, the selector, and the date
 * triggers read it, so a select and a text input stay the same height.
 */
import type { ControlSize } from "../controlSize";
import { touchControlMetrics } from "../touchMetrics";

/** The geometry of the framed input at one size, or on a touch surface. */
type InputSizing = {
  /**
   * The square box of an action inside the field, such as Clear, when the size
   * reserves one. Without it, an action is as large as its icon.
   */
  actionSize?: number;
  boxHeight: number;
  gap: number;
  iconSize: number;
  inputFontSize: number;
  inputHeight: number;
  paddingHorizontal: number;
  /** A floor for the input itself where its variant sets no height. */
  seamlessMinHeight?: number;
  textareaInputMinHeight: number;
  textareaLineHeight: number;
  textareaPaddingVertical: number;
};

/**
 * Per-size geometry for the framed input: the bordered box height, the gap
 * between the input and its adornments, the horizontal padding, the inner
 * `TextInput` height and type scale, and the matching icon diameter. `md`
 * matches the original 40px box; `sm` is the compact density and `lg` the
 * roomier, touch-first density. `xs` is the dense size: a 26px frame around a
 * 24px input, with 24px actions; its textarea keeps the `sm` lines.
 */
const INPUT_SIZES: Record<ControlSize, InputSizing> = {
  xs: {
    actionSize: 24,
    boxHeight: 26,
    gap: 6,
    iconSize: 14,
    inputFontSize: 13,
    inputHeight: 24,
    paddingHorizontal: 8,
    textareaInputMinHeight: 72,
    textareaLineHeight: 18,
    textareaPaddingVertical: 8,
  },
  sm: {
    boxHeight: 32,
    gap: 6,
    iconSize: 14,
    inputFontSize: 13,
    inputHeight: 30,
    paddingHorizontal: 10,
    textareaInputMinHeight: 72,
    // Explicit per-line height so an auto-growing textarea can convert a row
    // count into an exact pixel height on both platforms (native reads it from
    // the rendered text; web multiplies it against the measured `scrollHeight`).
    textareaLineHeight: 18,
    textareaPaddingVertical: 8,
  },
  md: {
    boxHeight: 40,
    gap: 8,
    iconSize: 16,
    inputFontSize: 14,
    inputHeight: 38,
    paddingHorizontal: 12,
    textareaInputMinHeight: 88,
    textareaLineHeight: 20,
    textareaPaddingVertical: 10,
  },
  lg: {
    boxHeight: 48,
    gap: 10,
    iconSize: 18,
    inputFontSize: 16,
    inputHeight: 46,
    paddingHorizontal: 14,
    textareaInputMinHeight: 104,
    textareaLineHeight: 22,
    textareaPaddingVertical: 12,
  },
};

/**
 * The input on a touch surface, whatever its size: the input itself is the
 * 44px target, so the bordered frame is 46px, its text is 16px, and each action
 * inside it is a 44px box. Textareas keep the `lg` lines.
 */
const INPUT_TOUCH_SIZE: InputSizing = {
  actionSize: touchControlMetrics.target,
  boxHeight: touchControlMetrics.fieldBoxHeight,
  gap: 8,
  iconSize: touchControlMetrics.iconSize,
  inputFontSize: touchControlMetrics.fieldFontSize,
  inputHeight: touchControlMetrics.inputHeight,
  paddingHorizontal: 12,
  seamlessMinHeight: touchControlMetrics.inputHeight,
  textareaInputMinHeight: INPUT_SIZES.lg.textareaInputMinHeight,
  textareaLineHeight: INPUT_SIZES.lg.textareaLineHeight,
  textareaPaddingVertical: INPUT_SIZES.lg.textareaPaddingVertical,
};

/** Diameter of the prefix / suffix / clear icons for a given input size, in px. */
export function inputIconSize(size: ControlSize) {
  return INPUT_SIZES[size].iconSize;
}

/**
 * The framed-field geometry for a given size — box height, gap, icon diameter,
 * text scale, and horizontal padding. Exported so the other controls that share
 * the input's bordered-box look (the {@link DropdownSelector} field and the date
 * triggers) size from the same scale and stay in lockstep with the text input.
 */
export function inputSizeTokens(size: ControlSize) {
  return INPUT_SIZES[size];
}

/**
 * The framed-field geometry on a touch surface, whatever the size: the touch
 * counterpart of {@link inputSizeTokens}, so a selector or a date trigger
 * beside a text field keeps its height on a phone too.
 */
export function touchInputSizeTokens() {
  return INPUT_TOUCH_SIZE;
}

/**
 * The pixel geometry for an auto-growing textarea at a given size: the resolved
 * per-line height plus the min/max box-content heights derived from the row
 * bounds. A textarea starts at `minRows` and grows one line at a time up to
 * `maxRows`, after which it scrolls. Shared by the {@link InputFrame} and the
 * `useAutoGrowTextarea` hook so the row→pixel conversion has a single source.
 *
 * Pass `maxRows: Infinity` for an uncapped field that grows to fit ALL its
 * content (the `seamless` variant, which reads as body text): the `maxHeight`
 * stays `Infinity`, and the hook drops it from the applied style so the field
 * never scrolls.
 */
export function autoGrowTextareaBounds(
  size: ControlSize,
  minRows: number,
  maxRows: number,
) {
  const lineHeight = INPUT_SIZES[size].textareaLineHeight;
  const lowRows = Math.max(1, minRows);
  const highRows = Math.max(lowRows, maxRows);
  return {
    lineHeight,
    minHeight: lowRows * lineHeight,
    // `Infinity * lineHeight` stays `Infinity` (an uncapped, grow-to-fit field).
    maxHeight: highRows * lineHeight,
  };
}
