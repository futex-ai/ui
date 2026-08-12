# Timeline

A multi-track editing timeline for React Native and React Native Web — the
ruler, lanes, clips, and playhead a video or audio editor is built around. It
renders only themed `View`s, `Text`, and `Image`, so there is no SVG, no canvas,
and no platform branching in the render path.

It is the reusable half of the video-editor family; the panels that surround it
(preview, transport, media bin, inspector, effects, keyframes, export) live in
[`../video-editor`](../video-editor/README.md).

## Responsibilities

- Lay a track list out as lanes and a clip list out as blocks within them,
  driven by one `pixelsPerSecond` zoom scalar.
- Draw an adaptive ruler whose tick density follows the zoom, from individual
  frames out to hours, with timecode labels that never collide.
- Render each clip's content from consumer-supplied data — a peak waveform from
  `peaks`, a filmstrip from `thumbnails` — windowed to the clip's current trim.
- Publish the playhead as a real slider, seekable by pointer and by keyboard.
- Pin a track-header gutter beside the lanes with the mute, solo, lock, and
  visibility toggles each track kind needs.
- Offer the full edit vocabulary — move, trim, slip, roll, razor split, and
  remove — by pointer on web, by touch on native, and by keyboard on both.
- Stay **controlled**: the component owns no clip state. Selections, seeks,
  header toggles, and edits are all reported for the consumer to apply, with
  `applyTimelineEdits` shipped as the canonical reducer.
- Size on the shared `ControlSize` scale (`sm` / `md` / `lg`).
- Use shared theme colours, fonts, and radii rather than consumer-local theme.

## Usage

```tsx
import { Timeline } from "@firna/ui/timeline";
import type { TimelineClipData, TimelineTrack } from "@firna/ui/timeline";

const tracks: TimelineTrack[] = [
  { id: "v1", kind: "video", name: "Picture" },
  { id: "a1", kind: "audio", name: "Dialogue" },
];

const clips: TimelineClipData[] = [
  { id: "shot-1", trackId: "v1", start: 0, duration: 8, label: "Harbour wide" },
  { id: "vo-1", trackId: "a1", start: 0.4, duration: 6, label: "VO intro" },
];

function Sequence() {
  const [playheadTime, setPlayheadTime] = useState(0);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  return (
    <Timeline
      accessibilityLabel="Sequence"
      clips={clips}
      duration={22}
      onSeek={setPlayheadTime}
      onSelectionChange={setSelectedClipIds}
      playheadTime={playheadTime}
      selectedClipIds={selectedClipIds}
      tracks={tracks}
    />
  );
}
```

### Editing

Supplying `onEdit` turns editing on. Every gesture — pointer, touch, or key —
resolves to one `TimelineEdit`, which the timeline reports rather than applies:

```tsx
const [clips, setClips] = useState(initialClips);

<Timeline
  clips={clips}
  onEdit={(edit) =>
    setClips((current) => applyTimelineEdits(current, [edit], { tracks }))
  }
  ripple={ripple}
  tool={tool}
  tracks={tracks}
  /* … */
/>;
```

`applyTimelineEdits` is the canonical reducer, so ripple and magnetic behaviour
come for free. It is also what the timeline runs its own live drag preview
through, which is why what a drag shows and what the drop commits cannot
disagree.

| Edit     | Produced by                                            |
| -------- | ------------------------------------------------------ |
| `move`   | Dragging a clip's body, or an Alt+arrow nudge          |
| `trim`   | Dragging an edge, or `[` / `]`                         |
| `slip`   | Dragging with the `slip` tool                          |
| `roll`   | Dragging a shared cut with the `roll` tool             |
| `split`  | Clicking with the `razor` tool, or `S` at the playhead |
| `remove` | `Delete` / `Backspace`                                 |

`tool` chooses what a drag means (`select`, `razor`, `slip`, `roll`). `ripple`
pushes whatever is downstream out of the way. A track flagged `magnetic` butts
its clips together after every edit. Locked clips and locked tracks refuse
edits, and say so.

Selection resolves on pointer-_down_, not on release: modifier keys are only
legible in the pointer stream, and a drag has to begin with the right clips in
hand. Plain click replaces, Cmd/Ctrl-click toggles one, Shift-click extends
along that clip's own track, and sweeping an empty patch of lane marquees.

### Time

Seconds — plain floats — are the unit of every public prop and callback. `fps`
(default `30`) exists only to quantize onto frame boundaries and to format
timecode, so a consumer never has to think in frames. Drop-frame timecode is not
modelled.

`formatTimecode`, `parseTimecode`, `formatClock`, `quantizeToFrame`, `timeToX`,
and `xToTime` are exported for building custom chrome. `parseTimecode` reads its
fields **right to left** — `"12"` is 12 frames, `"04:12"` is 4s 12f — the way an
editor's timecode field behaves as digits are typed into it.

### Clip content

`peaks` and `thumbnails` describe the **whole source**, not the trimmed clip, so
trimming reveals a different window of the same array instead of requiring fresh
data. Pair them with `sourceIn` and `sourceDuration` and the windowing is
automatic. Nothing here decodes audio or extracts frames — supply the arrays.

### Zoom

`pixelsPerSecond` is the only zoom control. The ruler picks its own tick ladder
from it, clip content resamples to whatever width results, and only the clips
overlapping the scrolled window are rendered, so a two-hour project costs the
same as a two-minute one.

## Interaction and accessibility

- **The ruler is a slider.** It carries `role="slider"` with literal
  `aria-value*` props — react-native-web does not translate `accessibilityValue`
  into ARIA, so both are emitted (WCAG 2.1 — 4.1.2 Name, Role, Value, A). Arrow
  keys step one frame, Shift+arrows one second, Page keys ten, and Home/End jump
  to the ends (2.1.1 Keyboard, A).
- **Clips are a single Tab stop.** A roving tabindex means one clip is tabbable
  at a time; Left/Right walk along a track, Up/Down cross to the nearest clip on
  the adjacent track, and Home/End jump to the ends of the current track (2.4.3
  Focus Order, A).
- **Editing without a pointer.** Bare arrows keep their navigation meaning, so
  editing lives on modified keys: `Alt`+Left/Right nudges by a frame (`Shift`
  for a second), `[` and `]` pull each edge in (`Shift` pushes it back out), `S`
  splits at the playhead, and `Delete` removes. A group edit follows the drag's
  rule — the focused clip carries the whole selection when it belongs to it, and
  acts alone when it does not.
- **Every committed edit is announced** through the shared live region, whatever
  produced it, and a refused edit says why rather than failing silently (WCAG
  2.1 — 4.1.3 Status Messages, AA).
- **Named labels.** Each clip announces itself as
  `"Interview A, Picture, 00:00:08:00 to 00:00:14:15"`, folding in `locked` and
  `selected`, so the state the border carries reaches assistive tech too (1.4.1
  Use of Color, A).
- **Header toggles say what they do.** A mute button is named "Mute Dialogue"
  and becomes "Unmute Dialogue" once pressed, rather than relying on an ARIA
  state react-native-web does not reliably emit.
- **Tone is never an edge bar.** Clips carry tone through a tinted fill, a
  uniform border, and the label colour. Selection thickens that same uniform
  border and adds an inset ring.

## Layout

The ruler, the lanes, and the playhead share one horizontal `ScrollView`, and
the track-header gutter is pinned outside it. One scroll offset therefore keeps
every layer in register with no scroll-sync code. Pass `maxHeight` to cap the
component; beyond it the gutter and lanes scroll vertically together.

## Pure helpers

The model is exported so consumers can build custom chrome or test against the
same maths the component uses:

- `timelineTime` — `formatTimecode`, `parseTimecode`, `tickStep`, `tickTimes`,
  `timeToX`, `xToTime`, `quantizeToFrame`
- `timelineLayout` — `trackLayouts`, `clipRect`, `visibleClips`, `clipAtTime`,
  `boundaryAtTime`, `contentWidth`
- `timelineSnap` — `snapCandidates`, `snapTime`, `snapOffset`,
  `snapToleranceSeconds`
- `timelineClipContent` — `waveformBars`, `filmstripFrames`, `sourceWindow`
- `timelineEditModel` — `resolveMove`, `resolveTrim`, `resolveSlip`,
  `resolveRoll`, `resolveSplit`
- `timelineEditApply` — `applyTimelineEdits`
- `timelineSelection` — `resolveClipSelection`, `marqueeSelection`
- `timelineKeyboardModel` — `nextFocusedClipId`, `keyToEditIntent`
- `timelineAnnounce` — `describeTimelineEdit`

## Key code

- [`Timeline.tsx`](./Timeline.tsx) — the controlled root
- [`TimelineRuler.tsx`](./TimelineRuler.tsx) — ticks, labels, and the scrub slider
- [`TimelineClip.tsx`](./TimelineClip.tsx) — the clip block and its content layers
- [`timelineStyles.ts`](./timelineStyles.ts) — density scale and tone resolution
- [`timelineEditModel.ts`](./timelineEditModel.ts) — every editing rule
- [`useTimelineDrag.web.ts`](./useTimelineDrag.web.ts) /
  [`useTimelineDrag.ts`](./useTimelineDrag.ts) — the pointer and touch plumbing

## Related docs

- [Video editor panels](../video-editor/README.md)
- [Plan](../../plans/video-editor-components.md)
- [Design spec](../../docs/superpowers/specs/2026-08-12-video-editor-ui-design.md)
- [Mockup](../../docs/mockups/video-editor.html)
