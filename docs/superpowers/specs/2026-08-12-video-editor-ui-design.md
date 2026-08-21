# Video editor UI — design

Status: approved 2026-08-12. Implementation plan: [`plans/video-editor-components.md`](../../../plans/video-editor-components.md).

## Goal

Add the component vocabulary a video editor needs to `@firna/ui`, and assemble
them into a combined Storybook demo that reads as a real editor. Two new
families ship: a reusable `timeline`, and a `video-editor` family holding the
surrounding panels.

## Boundaries

- **Chrome only.** No component touches a media API. `PreviewSurface` frames
  whatever player the consumer passes as children (`<video>`, `expo-video`, a
  canvas, a poster image). The library gains no new runtime dependency.
- **Data in, never derived.** Waveform peaks and filmstrip thumbnails are
  supplied by the consumer as plain arrays. Nothing decodes audio or extracts
  frames.
- **Controlled, with an exported reducer.** Components own no clip state. A
  gesture produces a `TimelineEdit`, which is reported through `onEdit`; the
  consumer applies it. `applyTimelineEdits(clips, edits)` ships as a pure
  function so consumers get the canonical ripple/magnetic implementation without
  reimplementing it. This mirrors `Kanban`'s `onCardMove` and `DataGrid`.
- **Both platforms.** Full pointer editing on web and touch editing on native,
  following the `useKanbanCardDrag` / `useKanbanCardDrag.web` split.

## Time model

Seconds (float) are the canonical unit across every public prop and callback.
`fps` exists only to quantize positions to frame boundaries and to format
timecode for display. Zoom is expressed as `pixelsPerSecond`.

All time math lives in pure modules that import nothing from `react-native`, so
`node --test` can exercise them directly.

## Family: `@firna/ui/timeline` (`src/timeline/`)

| Component             | Responsibility                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `Timeline`            | Controlled root — tracks, clips, playhead, zoom, tool, selection                          |
| `TimelineRuler`       | Adaptive tick density (frames → seconds → minutes by zoom), timecode labels, scrub target |
| `TimelineTrackHeader` | Fixed gutter: name, kind icon, mute / solo / lock / hide                                  |
| `TimelineClip`        | Label, waveform, filmstrip, trim handles, selection ring                                  |
| `TimelinePlayhead`    | Draggable head with a hairline through all tracks                                         |

Pure modules: `timelineTime` (frames ↔ seconds ↔ timecode, pixel mapping),
`timelineSnap`, `timelineLayout` (track offsets, clip rects, culling),
`timelineSelection`, `timelineKeyboardModel`, `timelineEditModel` (gesture →
edits, plus `applyTimelineEdits`).

Platform modules: `useTimelineDrag.web.ts` (document pointer capture),
`useTimelineDrag.ts` (native gestures), `timelineDragDom.ts` (web measuring).

### Edit vocabulary

`TimelineEdit` is a discriminated union describing the _result_ of a gesture, so
a consumer can apply it without re-deriving anything:

- `move` — new `{ clipId, trackId, start }` placements, optionally rippling
  downstream clips.
- `trim` — one clip's new `start` / `duration` / `sourceIn` for a dragged edge.
- `slip` — new `sourceIn` at a fixed timeline position.
- `roll` — a shared boundary between two adjacent clips moves.
- `split` — razor cut at a time, producing two clips.
- `remove` — delete clips, optionally closing the gap.

### Interaction

Snapping targets clip edges, the playhead, markers, and zero, within a
pixel-space tolerance so it feels constant at every zoom. Tracks marked
`magnetic` collapse gaps after an edit. Multi-select comes from click,
shift-click, and a marquee.

Keyboard: clips are one Tab stop with a roving tabindex. Arrows nudge by a frame
(Shift by a second), `[` / `]` trim the near edge, `S` splits at the playhead,
`Delete` removes. Every committed edit is announced through the shared
`announce`.

## Family: `@firna/ui/video-editor` (`src/video-editor/`)

| Component        | Responsibility                                                      |
| ---------------- | ------------------------------------------------------------------- |
| `PreviewSurface` | Aspect box, letterbox, thirds + safe-area guides, overlay slot      |
| `TransportBar`   | Play/pause, frame step, jump to ends, in/out, loop, timecode, speed |
| `Scrubber`       | Slider with buffered range, in/out region, chapter markers          |
| `LevelMeter`     | dBFS meter with peak hold and themed segments                       |
| `MediaBin`       | Grid/list asset browser, search, duration badges, selection         |
| `Inspector`      | Sections of typed property rows, reset, keyframe stopwatch          |
| `EffectsRack`    | Ordered effects (reordered via `SortableList`), enable, remove      |
| `KeyframeEditor` | Keyframe lanes plus a bezier curve graph                            |
| `ExportDialog`   | `Modal`-based export form with estimate and progress                |

Pure modules: `keyframeCurve`, `levelMeterScale`, `exportEstimate`.

## House constraints this inherits

- Tone is carried by tinted fill, uniform border, and icon color. **No left
  accent bar** (`tests/unit/noAccentBar.test.ts`).
- Every public component forwards `testID` and is registered in
  `tests/unit/testIDForwarding.test.ts`.
- Colors, fonts, and radii come from `SharedUiThemeProvider`; nothing is
  hardcoded. Both new families must render correctly under all four presets.
- Files stay near 200 lines and under 300.
- The `npm run verify` gate (format, unit, typecheck, build, package smoke,
  Storybook build, Playwright + axe sweep) must be green at every milestone.

## Known traps

- The ruler, the track lanes, and the header gutter must share one horizontal
  scroll offset while the gutter stays pinned — a scroll listener on web, an
  `Animated.ScrollView` on native.
- react-native-web drops `accessibilityValue`, so the scrub slider must also
  spread literal `aria-valuenow` / `aria-valuemin` / `aria-valuemax` /
  `aria-valuetext` props (see `src/loader/progressValue.ts`).
- `role="slider"` and `role="gridcell"` are absent from React Native's `Role`
  union and must be cast through a web-gated spread.
- New lucide icons and any newly-used React Native APIs must be added to
  `scripts/package-smoke-stubs.mjs` or `npm run test:package` fails.

## Storybook

`Timeline/Examples` covers the timeline in isolation. `Video editor/Examples`
covers each panel plus the headline combined demo: a hand-assembled flexbox
shell (media bin | preview + transport | inspector, timeline across the bottom)
driven by one `useState` project through `applyTimelineEdits`, with a simulated
playhead, selection flowing timeline → inspector → keyframes, and a working
export dialog. It ships in light and dark. Sample data lives in
`src/stories/videoEditorSampleData.ts` with deterministic peaks and data-URI
filmstrip frames so it renders offline in CI.
