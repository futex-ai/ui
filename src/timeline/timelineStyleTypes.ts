/** The shapes of the timeline's density metrics and of a clip's colors. */

/** Per-density metrics. `md` is the default. */
export type TimelineSizing = {
  /** Corner radius of a clip. */
  clipRadius: number;
  /** Padding inside a clip. */
  clipPadding: number;
  /** Font size of the clip label and header name. */
  fontSize: number;
  /** Width of the pinned track-header gutter. */
  headerWidth: number;
  /** Width of the grab area at each clip edge. */
  handleWidth: number;
  /** Height of the ruler strip above the lanes. */
  rulerHeight: number;
  /** Vertical gap between lanes. */
  trackGap: number;
  /** Default lane height when a track does not override it. */
  trackHeight: number;
  /** Icon size in the track header and clips. */
  iconSize: number;
};

/** The colors one clip paints with. */
export type TimelineClipColors = {
  /** Waveform bars, the kind icon, and the selected border. */
  accent: string;
  /** Resting border — uniform on all four edges, never an edge bar. */
  border: string;
  /** Clip body fill. */
  fill: string;
  /** Label and duration text, held to 4.5:1 on `fill`. */
  text: string;
};
