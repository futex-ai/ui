import assert from "node:assert/strict";
import test from "node:test";

import {
  describeExport,
  estimateEncodeSeconds,
  estimateFileSize,
  exportDuration,
  formatEstimatedTime,
  formatFileSize,
  resolutionLabel,
  type ExportSettings,
} from "../../src/video-editor/exportEstimate";

const settings: ExportSettings = {
  audioBitrateKbps: 192,
  format: "mp4",
  fps: 30,
  height: 1080,
  range: "whole",
  videoBitrateKbps: 12_000,
  width: 1920,
};

test("file size is the combined bitrate over the duration, in bytes", () => {
  // 12,192 kbps for 60s is 731,520,000 bits, or 91,440,000 bytes.
  assert.equal(estimateFileSize(60, 12_000, 192), 91_440_000);
  assert.equal(estimateFileSize(0, 12_000, 192), 0);
});

test("a silent or negative input cannot produce a negative size", () => {
  assert.equal(estimateFileSize(10, 5_000, 0), 6_250_000);
  assert.equal(estimateFileSize(-10, 5_000, 128), 0);
  assert.equal(estimateFileSize(10, -5_000, -128), 0);
});

test("sizes read as a person would say them", () => {
  assert.equal(formatFileSize(91_440_000), "91 MB");
  assert.equal(formatFileSize(1_240_000_000), "1.2 GB");
  assert.equal(formatFileSize(4_800_000), "4.8 MB");
  assert.equal(formatFileSize(2_400), "2.4 kB");
  assert.equal(formatFileSize(400), "400 B");
  assert.equal(formatFileSize(0), "0 MB");
  assert.equal(formatFileSize(Number.NaN), "0 MB");
});

test("encode time scales with the encoder's speed", () => {
  assert.equal(estimateEncodeSeconds(120, 2), 60);
  assert.equal(estimateEncodeSeconds(120, 0.5), 240);
  // A nonsense speed cannot produce an infinite or negative estimate.
  assert.equal(estimateEncodeSeconds(120, 0), 0);
  assert.equal(estimateEncodeSeconds(120, -1), 0);
});

test("an estimate is spoken in round terms, never to the second", () => {
  assert.equal(formatEstimatedTime(20), "less than a minute");
  assert.equal(formatEstimatedTime(59), "less than a minute");
  assert.equal(formatEstimatedTime(90), "about 2 minutes");
  assert.equal(formatEstimatedTime(60), "about 1 minute");
  assert.equal(formatEstimatedTime(7200), "about 2 hours");
  assert.equal(formatEstimatedTime(-5), "less than a minute");
});

test("the exported span honours the in and out marks when asked", () => {
  assert.equal(exportDuration(settings, 30), 30);
  assert.equal(exportDuration({ range: "in-out" }, 30, 4, 19), 15);
  // Marks the wrong way round still describe a real span.
  assert.equal(exportDuration({ range: "in-out" }, 30, 19, 4), 15);
  // Asking for in-to-out without marks falls back to the whole sequence.
  assert.equal(exportDuration({ range: "in-out" }, 30), 30);
});

test("standard 16:9 sizes get their familiar name", () => {
  assert.equal(resolutionLabel(1920, 1080), "1080p");
  assert.equal(resolutionLabel(1280, 720), "720p");
  assert.equal(resolutionLabel(3840, 2160), "4K");
});

test("a non-16:9 frame is named by its dimensions, not borrowed", () => {
  // A 1080-tall square is not "1080p".
  assert.equal(resolutionLabel(1080, 1080), "1080×1080");
  assert.equal(resolutionLabel(1080, 1920), "1080×1920");
  assert.equal(resolutionLabel(999, 555), "999×555");
});

test("the summary line folds the whole estimate into one sentence", () => {
  // A minute of footage at twice real time encodes in thirty seconds.
  assert.equal(
    describeExport(settings, 60, 2),
    "1:00 · 1080p · MP4 · about 91 MB, less than a minute",
  );
  // Ten minutes at half real time is a twenty-minute wait.
  assert.equal(
    describeExport(settings, 600, 0.5),
    "10:00 · 1080p · MP4 · about 914 MB, about 20 minutes",
  );
});
