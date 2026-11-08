/**
 * The settings sections of {@link ExportDialog}: an optional preset row, the
 * format rows, and the range row when the sequence has in and out points. They
 * are Inspector sections, so the fields behave like the properties panel.
 */
import type { ExportPreset, ExportSettings } from "./exportEstimate";
import type { InspectorSection } from "./inspectorModel";

const FORMAT_OPTIONS = [
  { label: "MP4 (H.264)", value: "mp4" },
  { label: "MOV (ProRes)", value: "mov" },
  { label: "WebM (VP9)", value: "webm" },
  { label: "GIF", value: "gif" },
];

const RESOLUTION_OPTIONS = [
  { label: "3840 × 2160", value: "3840x2160" },
  { label: "1920 × 1080", value: "1920x1080" },
  { label: "1280 × 720", value: "1280x720" },
  { label: "854 × 480", value: "854x480" },
];

/** The Inspector sections for the current export settings. */
export function exportDialogSections({
  exporting,
  hasRange,
  presetId,
  presets,
  settings,
}: {
  exporting: boolean;
  hasRange: boolean;
  presetId?: string;
  presets?: readonly ExportPreset[];
  settings: ExportSettings;
}): InspectorSection[] {
  const rows: InspectorSection[] = [];
  if (presets && presets.length > 0) {
    rows.push({
      id: "preset",
      properties: [
        {
          disabled: exporting,
          id: "preset",
          label: "Preset",
          options: presets.map((preset) => ({
            label: preset.detail
              ? `${preset.label} — ${preset.detail}`
              : preset.label,
            value: preset.id,
          })),
          type: "select",
          value: presetId ?? presets[0].id,
        },
      ],
      title: "Preset",
    });
  }
  rows.push({
    id: "format",
    properties: [
      {
        disabled: exporting,
        id: "format",
        label: "Format",
        options: FORMAT_OPTIONS,
        type: "select",
        value: settings.format,
      },
      {
        disabled: exporting,
        id: "resolution",
        label: "Size",
        options: RESOLUTION_OPTIONS,
        type: "select",
        value: `${settings.width}x${settings.height}`,
      },
      {
        disabled: exporting,
        id: "fps",
        label: "Frame rate",
        max: 120,
        min: 1,
        step: 1,
        type: "number",
        unit: "fps",
        value: settings.fps,
      },
      {
        disabled: exporting,
        id: "videoBitrateKbps",
        label: "Video",
        max: 200_000,
        min: 100,
        step: 100,
        type: "number",
        unit: "kbps",
        value: settings.videoBitrateKbps,
      },
      {
        disabled: exporting,
        id: "audioBitrateKbps",
        label: "Audio",
        max: 512,
        min: 0,
        step: 16,
        type: "number",
        unit: "kbps",
        value: settings.audioBitrateKbps,
      },
    ],
    title: "Format",
  });
  if (hasRange) {
    rows.push({
      id: "range",
      properties: [
        {
          disabled: exporting,
          id: "range",
          label: "Range",
          options: [
            { label: "Whole sequence", value: "whole" },
            { label: "In to out", value: "in-out" },
          ],
          type: "select",
          value: settings.range,
        },
      ],
      title: "Range",
    });
  }
  return rows;
}
