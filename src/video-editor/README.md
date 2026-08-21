# Video editor

The panels a video editor needs around its [`Timeline`](../timeline/README.md):
the program monitor and its transport, the media bin, the property inspector,
the effect chain, the keyframe editor, and the export dialog. For React Native
and React Native Web.

**It plays nothing and encodes nothing.** Every component here is chrome:
`PreviewSurface` frames whatever player you pass it, `TransportBar` reports
intent over playback state you own, `LevelMeter` renders numbers you measured,
and `ExportDialog` fronts whatever encoder you have. The library gains no media
dependency, which is what lets the same components serve a web player, an Expo
app, a storyboard tool, or a mock.

## Responsibilities

- Frame an aspect-correct monitor with letterboxing, composition guides, and an
  overlay slot for transform handles.
- Publish playback position as a real slider — seekable by pointer _and_ by
  keyboard, on both platforms.
- Meter audio on a curve that stretches the loud end, publishing each channel's
  reading rather than leaving it to colour alone.
- Browse media as cards or rows, with search, grouping, and selection.
- Edit typed properties from a controlled model, with reset and keyframe
  affordances per row.
- Order an effect chain, reusing the library's `SortableList` so reordering
  works by pointer and keyboard.
- Show and edit keyframes as compact lanes or as a value graph.
- Collect export settings, estimate the result, and report progress.
- Size on the shared `ControlSize` scale and take every colour from
  `SharedUiThemeProvider`.

## Usage

```tsx
import {
  PreviewSurface,
  TransportBar,
  MediaBin,
  Inspector,
  EffectsRack,
  KeyframeEditor,
  ExportDialog,
} from "@firna/ui/video-editor";

<PreviewSurface accessibilityLabel="Program monitor" showThirds>
  <video ref={videoRef} src={src} style={{ width: "100%", height: "100%" }} />
</PreviewSurface>

<TransportBar
  currentTime={time}
  duration={duration}
  onPlayPause={() => (playing ? video.pause() : video.play())}
  onSeek={(next) => (video.currentTime = next)}
  onStepFrame={(direction) => (video.currentTime += direction / 30)}
  playing={playing}
/>;
```

Every control on the transport is optional and appears only when its handler is
supplied, so the same component is a bare play/pause pair in a compact panel and
a full deck with in/out marks, loop, speed, and metering in an editor.

### The property model

`Inspector` renders whatever `sections` describe. A property's `type` chooses
its control — `number` (a drag-or-type `NumberScrubber`), `toggle`, `select`,
`color`, `text` — so adding a control to a panel is a data change:

```tsx
<Inspector
  onChange={(id, value) => setProperty(id, value)}
  onReset={(id) => resetProperty(id)}
  onToggleKeyframe={(id) => toggleKeyframe(id)}
  sections={[
    {
      id: "transform",
      title: "Transform",
      properties: [
        {
          type: "number",
          id: "scale",
          label: "Scale",
          value: 112,
          unit: "%",
          min: 1,
          max: 400,
          step: 1,
          defaultValue: 100,
        },
        {
          type: "select",
          id: "blend",
          label: "Blend",
          value: "screen",
          options: [
            { label: "Normal", value: "normal" },
            { label: "Screen", value: "screen" },
          ],
        },
      ],
    },
  ]}
/>
```

A reset appears only where the value differs from its `defaultValue`; the
keyframe stopwatch appears only when `onToggleKeyframe` is supplied.

`EffectsRack` and `ExportDialog` both render their own bodies through
`Inspector`, so an effect's parameters and the export settings behave exactly
like the properties panel rather than being a second, subtly different set.

### Keyframes

`KeyframeEditor` reads the same `pixelsPerSecond` the timeline does, so the two
line up. Interpolation is per-segment and lives on the keyframe a segment
_leaves_, so easing out of one keyframe does not force the same easing into the
next:

```tsx
const track: KeyframeTrack = {
  id: "kf-opacity",
  propertyId: "opacity",
  label: "Opacity",
  min: 0,
  max: 100,
  keyframes: [
    { id: "a", time: 8, value: 0, interpolation: "bezier" },
    { id: "b", time: 9.5, value: 100 },
  ],
};
```

`valueAt(keyframes, time)` evaluates a track at any moment; outside the
keyframed range the value holds flat rather than extrapolating.

## Interaction and accessibility

- **Sliders publish their value twice.** The scrub bar carries both
  `accessibilityValue` and the literal `aria-value*` props, because
  react-native-web does not translate the former (WCAG 2.1 — 4.1.2, A).
- **Nothing seeks off a press handler.** react-native-web's press event carries
  no `locationX`, so scrub surfaces run off the responder — which also gives
  continuous drag-scrubbing on both platforms.
- **Buttons name their action, not their glyph.** A transport button is
  "Pause", a bin toggle is "Show media as a list", a stopwatch is "Start
  keyframing Opacity" (WCAG 2.1 — 1.1.1, A; 4.1.2, A).
- **Meters and selection do not rely on colour.** Each meter channel publishes
  its dBFS reading; a selected asset says "selected" in its accessible name
  (WCAG 2.1 — 1.4.1 Use of Colour, A).
- **Export failures announce themselves** through `role="alert"` rather than
  waiting to be re-read (WCAG 2.1 — 4.1.3 Status Messages, AA).
- **Section disclosures publish `aria-expanded`** as a literal prop, since
  react-native-web does not emit it from `accessibilityState`.

## Pure helpers

- `levelMeterScale` — `dbToFraction`, `meterBands`, `zoneForDb`, `describeLevel`
- `previewAspect` — `aspectRatioOf`, `SAFE_INSETS`
- `mediaBinModel` — `filterAssets`, `groupAssets`, `describeAsset`
- `inspectorModel` — `clampToRange`, `decimalsFor`, `formatPropertyValue`,
  `describeProperty`, `isPropertyModified`
- `keyframeCurve` — `valueAt`, `bezierValueAt`, `curveSamples`, `moveKeyframe`,
  `trackRange`, `normaliseValue`
- `exportEstimate` — `estimateFileSize`, `formatFileSize`,
  `estimateEncodeSeconds`, `formatEstimatedTime`, `resolutionLabel`,
  `describeExport`

All are free of a runtime `react-native` import, so they run under `node --test`
and in any non-React context.

## Key code

- [`PreviewSurface.tsx`](./PreviewSurface.tsx) — the monitor frame
- [`TransportBar.tsx`](./TransportBar.tsx) — the deck
- [`Inspector.tsx`](./Inspector.tsx) / [`InspectorRow.tsx`](./InspectorRow.tsx)
  — the typed property rows every other panel reuses
- [`KeyframeEditor.tsx`](./KeyframeEditor.tsx) — lanes and curves

## Related docs

- [Timeline](../timeline/README.md)
- [Plan](../../plans/video-editor-components.md)
- [Design spec](../../docs/superpowers/specs/2026-08-12-video-editor-ui-design.md)
- [Mockup](../../docs/mockups/video-editor.html)
