/** Calendar examples for the Date stories: single dates and a range. */
import { ShieldQuestionMark } from "../primitives/icons";
import { useState } from "react";
import { Text, View } from "../primitives/reactNative";

import { DateField, DateRangeField, type DateRange } from "../index";

export function SingleDateExample() {
  const [value, setValue] = useState("2026-03-31");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        hint="Pick a day or type it as 31 Mar 2026."
        label="Year ends"
        onChange={setValue}
        value={value}
      />
    </View>
  );
}

export function DateFieldSizesExample() {
  const [extraSmall, setExtraSmall] = useState("2026-03-31");
  const [small, setSmall] = useState("2026-03-31");
  const [medium, setMedium] = useState("2026-03-31");
  const [large, setLarge] = useState("2026-03-31");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        label="Extra small"
        onChange={setExtraSmall}
        size="xs"
        value={extraSmall}
      />
      <DateField label="Small" onChange={setSmall} size="sm" value={small} />
      <DateField label="Medium" onChange={setMedium} size="md" value={medium} />
      <DateField label="Large" onChange={setLarge} size="lg" value={large} />
    </View>
  );
}

export function ClearableDateExample() {
  const [value, setValue] = useState("2026-03-31");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        clearable
        hint="With clearable, a ✕ appears once a value is set."
        label="Year ends"
        onChange={setValue}
        value={value}
      />
    </View>
  );
}

export function BoundedDateExample() {
  const [value, setValue] = useState("2026-03-31");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        hint="Click the title to pick a year; only 2024–2027 are selectable."
        label="Year ends"
        max="2027-12-31"
        min="2024-01-01"
        onChange={setValue}
        value={value}
      />
    </View>
  );
}

export function ValidatedDateExample() {
  // A future-dated value drives a visible, programmatically-associated error so
  // the error/label wiring (aria-describedby / aria-errormessage / role=alert)
  // is exercised — WCAG 2.1 3.3.1 / 1.3.1 / 4.1.3.
  const [value, setValue] = useState("2027-01-01");
  const error =
    value && value > "2026-12-31"
      ? "Choose a date on or before 31 Dec 2026."
      : null;
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        error={error}
        hint="The year end must fall within the current period."
        label="Year ends"
        max="2026-12-31"
        onChange={setValue}
        required
        value={value}
      />
    </View>
  );
}

export function LabelInfoDateExample() {
  const [value, setValue] = useState("2026-03-31");
  const [range, setRange] = useState<DateRange>({
    end: "2026-03-31",
    start: "2025-04-01",
  });
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        // The ⓘ after the label opens a tooltip with the detail, so the
        // always-read `hint` stays free for short, everyday guidance.
        hint="Pick a day or type it as 31 Mar 2026."
        label="Year ends"
        labelInfo="Your financial year end is the last day of your accounting period. It sets the date range every report defaults to."
        onChange={setValue}
        value={value}
      />
      <DateRangeField
        // `labelInfoIcon` swaps the default ⓘ glyph and `labelInfoLabel` names
        // the button when the default reads awkwardly.
        label="Comparison period"
        labelInfo="Reports compare the current period against this earlier range. Pick the equivalent period last year for a like-for-like view."
        labelInfoIcon={ShieldQuestionMark}
        labelInfoLabel="How the comparison period is used"
        onChange={setRange}
        value={range}
      />
    </View>
  );
}

export function CalendarLayeringExample() {
  const [value, setValue] = useState("2026-03-31");
  return (
    <View style={{ minWidth: 340, width: 340 }}>
      <DateField
        label="Layered date"
        onChange={setValue}
        value={value}
        zIndex={2_000_000}
      />
      <View
        style={{
          backgroundColor: "#E6EFE7",
          borderColor: "#BCD2C4",
          borderRadius: 8,
          borderWidth: 1,
          marginTop: -16,
          minHeight: 180,
          padding: 18,
          position: "relative",
          zIndex: 1_500_000,
        }}
      >
        <Text
          style={{
            color: "#28352D",
            fontSize: 16,
            fontWeight: "700",
          }}
        >
          Overlapping panel
        </Text>
      </View>
    </View>
  );
}

export function DateRangeExample() {
  const [value, setValue] = useState<DateRange>({
    end: "2026-03-31",
    start: "2025-04-01",
  });
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateRangeField
        hint="Both endpoints are independent calendars."
        label="Current period"
        onChange={setValue}
        value={value}
      />
    </View>
  );
}
