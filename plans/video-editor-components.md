# Video editor components

Status: in progress. Design spec:
[`docs/superpowers/specs/2026-08-12-video-editor-ui-design.md`](../docs/superpowers/specs/2026-08-12-video-editor-ui-design.md).

Two new families: a reusable `@firna/ui/timeline`, and `@firna/ui/video-editor`
for the surrounding panels. Chrome only — no media APIs, no new runtime
dependency. Components are controlled; a pure `applyTimelineEdits` reducer ships
alongside so consumers get the canonical ripple/magnetic behaviour for free.

Every milestone ends with `npm run verify` green.

## M1 — Time foundation and a read-only timeline

Pure time/layout/snap math plus a timeline that renders tracks, clips, a ruler,
and a playhead, and seeks on tap. No dragging yet.

- [x] Add `src/timeline/timelineTypes.ts` — `TimelineTrack`, `TimelineClip`, `TimelineEdit` union, tool and tone vocabularies
- [x] Add `src/timeline/timelineTime.ts` — seconds ↔ frames, `formatTimecode` / `parseTimecode`, `timeToX` / `xToTime`, tick-step selection
- [x] Add `src/timeline/timelineLayout.ts` — track offsets, clip rects, visible-window culling
- [x] Add `src/timeline/timelineSnap.ts` — snap candidates and pixel-tolerance resolution
- [x] Add `src/timeline/timelineStyles.ts` — themed stylesheet factory
- [x] Add `src/timeline/TimelineRuler.tsx` — adaptive ticks and timecode labels
- [x] Add `src/timeline/TimelineTrackHeader.tsx` — name, kind icon, mute/solo/lock/hide toggles
- [x] Add `src/timeline/TimelineClip.tsx` — label, waveform, filmstrip, tone fill (no accent bar)
- [x] Add `src/timeline/TimelinePlayhead.tsx` — head and hairline
- [x] Add `src/timeline/Timeline.tsx` — controlled root, synced horizontal scroll, pinned gutter, tap-to-seek
- [x] Add `src/timeline/index.ts` and wire `src/index.ts`
- [x] Add the `./timeline` entry to `package.json` exports and `tests/unit/packageExports.test.ts`
- [x] Add `tests/unit/timelineTime.test.ts`, `timelineLayout.test.ts`, `timelineSnap.test.ts`
- [x] Register the new components in `tests/unit/testIDForwarding.test.ts`
- [x] Add `src/stories/timelineSampleData.ts` — deterministic peaks and data-URI filmstrip frames
- [x] Add `src/stories/timeline.stories.tsx` (`Timeline/Examples`)
- [x] Add `docs/mockups/video-editor.html` with mobile and desktop variants
- [x] Add the new lucide icons and React Native `Image` to `scripts/package-smoke-stubs.mjs`
- [x] Add `src/timeline/README.md`
- [x] `npm run verify` green

## M2 — Pointer editing on the web

The full pro edit vocabulary, driven by the pointer, with a live ghost preview
and snap indicator.

- [x] Add `src/timeline/timelineEditModel.ts` — gesture → `TimelineEdit`, plus `applyTimelineEdits`
- [x] Add ripple, magnetic-collapse, roll, and slip math to the edit model
- [x] Add `src/timeline/timelineSelection.ts` — click / shift-click / marquee selection resolution
- [x] Add `src/timeline/timelineDragDom.ts` — web rect measuring by `data-testid`
- [x] Add `src/timeline/useTimelineDrag.web.ts` — pointer capture, move/trim/slip/roll sessions, ghost positioning
- [x] Add `src/timeline/useTimelineDrag.ts` — inert native stub (replaced in M3)
- [x] Add `src/timeline/TimelineMarquee.tsx` and the snap indicator
- [x] Add razor-tool split on click
- [x] Add `tests/unit/timelineEdits.test.ts` and `tests/unit/timelineSelection.test.ts`
- [x] Extend the timeline story with an editable example
- [x] Add `tests/browser/timeline.spec.ts` — pointer move, cross-track drag, edge trim, preview parity, marquee, razor, locked-clip refusal
- [x] `npm run verify` green

## M3 — Native touch, keyboard, and accessibility

- [ ] Implement the native `useTimelineDrag` with `PanResponder` move and trim gestures
- [ ] Add `src/timeline/timelineKeyboardModel.ts` — key → edit intent
- [ ] Wire roving-tabindex focus across clips, arrow nudge, `[` / `]` trim, `S` split, `Delete` remove
- [ ] Announce every committed edit through `announce`
- [ ] Give the ruler `role="slider"` with literal `aria-value*` props
- [ ] Add `tests/unit/timelineKeyboard.test.ts`
- [ ] Add `tests/browser/timeline.spec.ts` — drag, trim, marquee, keyboard nudge
- [ ] Confirm the axe sweep stays green for the timeline stories
- [ ] `npm run verify` green

## M4 — Preview, transport, and metering

- [ ] Add `src/video-editor/videoEditorStyles.ts`
- [ ] Add `src/video-editor/PreviewSurface.tsx` — aspect box, letterbox, guides, overlay slot
- [ ] Add `src/video-editor/Scrubber.tsx` — buffered range, in/out region, markers, slider semantics
- [ ] Add `src/video-editor/levelMeterScale.ts` and `LevelMeter.tsx`
- [ ] Add `src/video-editor/TransportBar.tsx` — play/pause, frame step, jump, in/out, loop, timecode, speed
- [ ] Add `src/video-editor/index.ts`, wire `src/index.ts`, `package.json` exports, `packageExports.test.ts`
- [ ] Add `tests/unit/levelMeter.test.ts` and `tests/unit/scrubber.test.ts`
- [ ] Add `src/stories/videoEditor.stories.tsx` with per-component stories and the combined shell scaffold
- [ ] Add `src/stories/videoEditorSampleData.ts`
- [ ] `npm run verify` green

## M5 — Media bin and inspector

- [ ] Add `src/video-editor/MediaBin.tsx` and `MediaBinItem.tsx` — grid/list, search, duration badge, selection
- [ ] Add `src/video-editor/NumberScrubber.tsx` — drag-to-change numeric field
- [ ] Add `src/video-editor/Inspector.tsx` — sections, typed rows, reset, keyframe stopwatch
- [ ] Add `tests/unit/mediaBin.test.ts` and `tests/unit/inspector.test.ts`
- [ ] Wire both panels into the combined story, with selection driving the inspector
- [ ] `npm run verify` green

## M6 — Effects rack and keyframe editor

- [ ] Add `src/video-editor/EffectsRack.tsx` — reorder via `SortableList`, enable toggle, remove, nested params
- [ ] Add `src/video-editor/keyframeCurve.ts` — interpolation, bezier evaluation, hit testing
- [ ] Add `src/video-editor/KeyframeEditor.tsx` — lane mode and curve mode
- [ ] Add `tests/unit/keyframeCurve.test.ts`
- [ ] Wire both into the combined story
- [ ] `npm run verify` green

## M7 — Export dialog

- [ ] Add `src/video-editor/exportEstimate.ts` — bitrate/duration → size and time estimates
- [ ] Add `src/video-editor/ExportDialog.tsx` — presets, format fields, range, estimate, progress, cancel
- [ ] Add `tests/unit/exportEstimate.test.ts`
- [ ] Wire an Export action into the combined story
- [ ] `npm run verify` green

## M8 — Combined story, docs, and release readiness

- [ ] Finish `Full editor` and `Full editor (dark)` stories
- [ ] Add a responsive/mobile layout branch to the combined story
- [ ] Write `src/video-editor/README.md`
- [ ] Update `src/timeline/README.md` for the editing model
- [ ] Update the root `README.md` component list
- [ ] Move this plan to Completed in `plans/README.md`
- [ ] Final `npm run verify` green
