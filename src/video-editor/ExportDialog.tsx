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
import { Text, View } from "../primitives/reactNative";

import { Button } from "../button";
import type { ControlSize } from "../controlSize";
import { standardControlSize } from "../controlSizeTables";
import type { FocusIndicator } from "../focusRing";
import { ProgressBar } from "../loader";
import { WebModalFrame } from "../modal";
import { useSharedUiTheme } from "../theme";

import { Inspector } from "./Inspector";
import { exportDialogSections } from "./exportDialogSections";
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
  focusIndicator?: FocusIndicator;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function ExportDialog({
  duration,
  errorMessage,
  focusIndicator,
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

  const sections = useMemo<InspectorSection[]>(
    () =>
      exportDialogSections({
        exporting,
        hasRange,
        presetId,
        presets,
        settings,
      }),
    [exporting, hasRange, presetId, presets, settings],
  );

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
      focusIndicator={focusIndicator}
      footer={
        <>
          {exporting ? (
            <Button
              focusIndicator={focusIndicator}
              onPress={onCancel}
              size={standardControlSize(size)}
              tone="secondary"
            >
              Cancel export
            </Button>
          ) : (
            <Button
              focusIndicator={focusIndicator}
              onPress={onClose}
              size={standardControlSize(size)}
              tone="secondary"
            >
              Close
            </Button>
          )}
          <Button
            busy={exporting}
            focusIndicator={focusIndicator}
            onPress={exporting ? undefined : onStart}
            size={standardControlSize(size)}
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
          focusIndicator={focusIndicator}
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
