/**
 * The inspector model the stories show for whatever clip is selected.
 *
 * A real editor derives these from the clip's effect stack; the stories keep a
 * per-clip map of overrides over a fixed set of defaults, which is enough to
 * demonstrate every row type, the reset action, and the keyframe stopwatch.
 */
import type {
  InspectorProperty,
  InspectorSection,
  InspectorValue,
  TimelineClipData,
} from "../index";

/** Overrides keyed by clip id, then by property id. */
export type PropertyOverrides = Record<string, Record<string, InspectorValue>>;

const SWATCHES = ["#4f7864", "#946727", "#a84f45", "#315f96", "#1c1f1d"];

function value(
  overrides: PropertyOverrides,
  clipId: string,
  propertyId: string,
  fallback: InspectorValue,
): InspectorValue {
  return overrides[clipId]?.[propertyId] ?? fallback;
}

/**
 * The sections shown for a clip. Audio clips get level and pan; picture clips
 * get transform and opacity — the panel follows the selection rather than
 * showing every control for everything.
 */
export function inspectorSectionsFor(
  clip: TimelineClipData | undefined,
  overrides: PropertyOverrides,
  collapsedSectionIds: readonly string[],
): InspectorSection[] {
  if (!clip) {
    return [];
  }
  const isAudio = clip.trackId.startsWith("a");
  const read = (propertyId: string, fallback: InspectorValue) =>
    value(overrides, clip.id, propertyId, fallback);

  const transform: InspectorProperty[] = [
    {
      defaultValue: 0,
      id: "positionX",
      label: "Position X",
      step: 1,
      type: "number",
      unit: "px",
      value: read("positionX", 0) as number,
    },
    {
      defaultValue: 0,
      id: "positionY",
      label: "Position Y",
      step: 1,
      type: "number",
      unit: "px",
      value: read("positionY", 0) as number,
    },
    {
      defaultValue: 100,
      id: "scale",
      label: "Scale",
      max: 400,
      min: 1,
      step: 1,
      type: "number",
      unit: "%",
      value: read("scale", 100) as number,
    },
    {
      defaultValue: 100,
      id: "opacity",
      label: "Opacity",
      max: 100,
      min: 0,
      step: 1,
      type: "number",
      unit: "%",
      value: read("opacity", 100) as number,
    },
  ];

  const audio: InspectorProperty[] = [
    {
      defaultValue: 0,
      id: "gain",
      label: "Level",
      max: 12,
      min: -60,
      step: 0.5,
      type: "number",
      unit: "dB",
      value: read("gain", 0) as number,
    },
    {
      defaultValue: 0,
      id: "pan",
      label: "Pan",
      max: 100,
      min: -100,
      step: 1,
      type: "number",
      value: read("pan", 0) as number,
    },
    {
      defaultValue: false,
      id: "ducking",
      label: "Ducking",
      type: "toggle",
      value: read("ducking", false) as boolean,
    },
  ];

  const look: InspectorProperty[] = [
    {
      id: "blend",
      label: "Blend",
      options: [
        { label: "Normal", value: "normal" },
        { label: "Screen", value: "screen" },
        { label: "Multiply", value: "multiply" },
        { label: "Overlay", value: "overlay" },
      ],
      type: "select",
      value: read("blend", "normal") as string,
    },
    {
      id: "tint",
      label: "Tint",
      swatches: SWATCHES,
      type: "color",
      value: read("tint", SWATCHES[0]) as string,
    },
    {
      id: "note",
      label: "Note",
      placeholder: "Add a note",
      type: "text",
      value: read("note", "") as string,
    },
  ];

  const sections: InspectorSection[] = isAudio
    ? [
        { id: "audio", properties: audio, title: "Audio" },
        { id: "look", properties: look, title: "Metadata" },
      ]
    : [
        { id: "transform", properties: transform, title: "Transform" },
        { id: "look", properties: look, title: "Look" },
      ];

  return sections.map((section) => ({
    ...section,
    collapsed: collapsedSectionIds.includes(section.id),
  }));
}

/** The default a reset returns a property to, if it declares one. */
export function defaultForProperty(
  sections: readonly InspectorSection[],
  propertyId: string,
): InspectorValue | undefined {
  for (const section of sections) {
    for (const property of section.properties) {
      if (property.id === propertyId) {
        return property.defaultValue;
      }
    }
  }
  return undefined;
}
