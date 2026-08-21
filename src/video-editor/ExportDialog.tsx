/**
 * The export sheet.
 *
 * Built on the library's own modal frame, so focus trapping, restore, Escape,
 * and the platform split (a centred dialog on web, a sheet on native) all come
 * from one place. The settings are rendered by the {@link Inspector}, so the
 * fields behave exactly like the ones in the properties panel rather than being
 * a second, subtly different set.
 *
 * It exports nothing. `status` and `progress` are the consumer's, and the
 * actions report intent — the dialog is the same whether the encoder is
 * ffmpeg.wasm, a server job, or a native pipeline.
 */
import { useMemo } from "react";
import { Text, View } from "react-native";

import { Button } from "../button";
import type { ControlSize } from "../controlSize";
import { ProgressBar } from "../loader";
import { WebModalFrame } from "../modal";
import { useSharedUiTheme } from "../theme";

import { Inspector } from "./Inspector";
import type { InspectorSection, InspectorValue } from "./inspectorModel";
import {
  describeExport,
  exportDuration,
  type ExportPreset,
  type ExportSettings,
} from "./exportEstimate";
import { createExportStyles } from "./exportStyles";

/** Where an export has got to. */
export type ExportStatus = "done" | "exporting" | "failed" | "idle";

export type ExportDialogProps = {
  visible: boolean;
  onClose: () => void;
  settings: ExportSettings;
  onSettingsChange?: (settings: ExportSettings) => void;
  /** Offered presets. Supplying them adds a preset row. */
  presets?: readonly ExportPreset[];
  /** The preset currently applied, if any. */
  presetId?: string;
  onPresetChange?: (presetId: string) => void;

  /** Sequence length in seconds. */
  duration: number;
  inPoint?: number;
  outPoint?: number;

  status?: ExportStatus;
  /** Progress as a `0..1` fraction while `status` is `"exporting"`. */
  progress?: number;
  /** Message shown when `status` is `"failed"`. */
  errorMessage?: string;
  onStart?: () => void;
  onCancel?: () => void;

  /** Seconds of footage encoded per second of wall clock. Default `2`. */
  speedFactor?: number;
  title?: string;
  size?: ControlSize;
  disableFocusRing?: boolean;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

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

export function ExportDialog({
  disableFocusRing = false,
  duration,
  errorMessage,
  inPoint,
  onCancel,
  onClose,
  onPresetChange,
  onSettingsChange,
  onStart,
  outPoint,
  presetId,
  presets,
  progress = 0,
  settings,
  size = "md",
  speedFactor = 2,
  status = "idle",
  testID,
  title = "Export",
  visible,
}: ExportDialogProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createExportStyles(theme), [theme]);
  const span = exportDuration(settings, duration, inPoint, outPoint);
  const exporting = status === "exporting";
  const hasRange = inPoint !== undefined && outPoint !== undefined;

  const sections = useMemo<InspectorSection[]>(() => {
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
  }, [exporting, hasRange, presetId, presets, settings]);

  const handleChange = (propertyId: string, value: InspectorValue) => {
    if (propertyId === "preset") {
      onPresetChange?.(String(value));
      return;
    }
    if (!onSettingsChange) {
      return;
    }
    if (propertyId === "resolution") {
      const [width, height] = String(value).split("x").map(Number);
      onSettingsChange({ ...settings, height, width });
      return;
    }
    if (propertyId === "format") {
      onSettingsChange({
        ...settings,
        format: String(value) as ExportSettings["format"],
      });
      return;
    }
    if (propertyId === "range") {
      onSettingsChange({
        ...settings,
        range: String(value) as ExportSettings["range"],
      });
      return;
    }
    onSettingsChange({ ...settings, [propertyId]: Number(value) });
  };

  return (
    <WebModalFrame
      disableFocusRing={disableFocusRing}
      footer={
        <>
          {exporting ? (
            <Button
              disableFocusRing={disableFocusRing}
              onPress={onCancel}
              size={size}
              tone="secondary"
            >
              Cancel export
            </Button>
          ) : (
            <Button
              disableFocusRing={disableFocusRing}
              onPress={onClose}
              size={size}
              tone="secondary"
            >
              Close
            </Button>
          )}
          <Button
            busy={exporting}
            disableFocusRing={disableFocusRing}
            onPress={exporting ? undefined : onStart}
            size={size}
            testID={testID ? `${testID}-start` : undefined}
            tone="primary"
          >
            {exporting ? "Exporting" : "Export"}
          </Button>
        </>
      }
      onClose={onClose}
      subtitle={describeExport(settings, span, speedFactor)}
      testID={testID}
      title={title}
      visible={visible}
    >
      <View style={styles.body}>
        <Inspector
          disableFocusRing={disableFocusRing}
          onChange={handleChange}
          sections={sections}
          size={size}
          style={styles.settings}
        />
        {exporting ? (
          <View style={styles.progress}>
            <ProgressBar
              accessibilityLabel="Export progress"
              testID={testID ? `${testID}-progress` : undefined}
              value={progress}
            />
            <Text style={styles.progressText}>
              {Math.round(progress * 100)}% complete
            </Text>
          </View>
        ) : null}
        {status === "done" ? (
          <Text style={styles.doneText}>Export finished.</Text>
        ) : null}
        {status === "failed" ? (
          // `alert` so a failure is announced the moment it appears, rather
          // than only being found by someone re-reading the dialog (WCAG 2.1 —
          // 4.1.3 Status Messages, AA).
          <Text role="alert" style={styles.errorText}>
            {errorMessage ?? "Export failed."}
          </Text>
        ) : null}
      </View>
    </WebModalFrame>
  );
}
