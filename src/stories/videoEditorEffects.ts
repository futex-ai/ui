/**
 * The effect chain and keyframe tracks the video-editor stories show.
 *
 * Fixed data rather than derived: the point is to demonstrate the rack and the
 * curve editor, and a hand-authored chain reads more like a real project than
 * anything generated would.
 */
import type { EffectEntry, EffectOption, KeyframeTrack } from "../index";

export const sampleEffects: EffectEntry[] = [
  {
    enabled: true,
    id: "effect-balance",
    name: "Colour balance",
    properties: [
      {
        defaultValue: 0,
        id: "temperature",
        label: "Temp",
        max: 100,
        min: -100,
        step: 1,
        type: "number",
        value: 18,
      },
      {
        defaultValue: 0,
        id: "tintShift",
        label: "Tint",
        max: 100,
        min: -100,
        step: 1,
        type: "number",
        value: -6,
      },
    ],
  },
  {
    collapsed: true,
    enabled: false,
    id: "effect-blur",
    name: "Gaussian blur",
    properties: [
      {
        defaultValue: 0,
        id: "radius",
        label: "Radius",
        max: 200,
        min: 0,
        step: 0.5,
        type: "number",
        unit: "px",
        value: 12,
      },
    ],
  },
  {
    enabled: true,
    id: "effect-vignette",
    name: "Vignette",
    properties: [
      {
        defaultValue: 50,
        id: "amount",
        label: "Amount",
        max: 100,
        min: 0,
        step: 1,
        type: "number",
        unit: "%",
        value: 34,
      },
    ],
  },
];

export const sampleEffectOptions: EffectOption[] = [
  { id: "effect-sharpen", label: "Sharpen" },
  { id: "effect-grain", label: "Film grain" },
  { id: "effect-lut", label: "LUT" },
];

export const sampleKeyframeTracks: KeyframeTrack[] = [
  {
    id: "kf-opacity",
    keyframes: [
      { id: "op-0", interpolation: "bezier", time: 8, value: 0 },
      { id: "op-1", interpolation: "linear", time: 9.5, value: 100 },
      { id: "op-2", interpolation: "bezier", time: 13, value: 100 },
      { id: "op-3", time: 14.5, value: 0 },
    ],
    label: "Opacity",
    max: 100,
    min: 0,
    propertyId: "opacity",
    unit: "%",
  },
  {
    id: "kf-scale",
    keyframes: [
      { id: "sc-0", interpolation: "bezier", time: 8, value: 100 },
      { id: "sc-1", time: 14.5, value: 118 },
    ],
    label: "Scale",
    max: 140,
    min: 90,
    propertyId: "scale",
    unit: "%",
  },
];
