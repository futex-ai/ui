/**
 * Wheel examples for the Date stories: the spinning day, month, and year
 * picker.
 */
import { useState } from "react";
import { View } from "../primitives/reactNative";

import { DateField, DateRangeField, type DateRange } from "../index";

export function WheelDateExample() {
  const [value, setValue] = useState("2026-03-31");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        hint="Tap to open the spinning day/month/year wheel."
        label="Year ends"
        onChange={setValue}
        value={value}
        variant="wheel"
      />
    </View>
  );
}

export function BoundedWheelDateExample() {
  const [value, setValue] = useState("2026-03-15");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        hint="Only Mar 2026 is selectable; out-of-range spins snap back."
        label="Delivery date"
        max="2026-03-20"
        min="2026-03-10"
        onChange={setValue}
        value={value}
        variant="wheel"
      />
    </View>
  );
}

export function ClearableWheelDateExample() {
  const [value, setValue] = useState("2026-03-31");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateField
        clearable
        hint="Wheel variant with a ✕ that clears the value."
        label="Year ends"
        onChange={setValue}
        value={value}
        variant="wheel"
      />
    </View>
  );
}

export function WheelDateRangeExample() {
  const [value, setValue] = useState<DateRange>({
    end: "2026-03-31",
    start: "2025-04-01",
  });
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DateRangeField
        hint="Each endpoint opens its own spinning wheel."
        label="Current period"
        onChange={setValue}
        value={value}
        variant="wheel"
      />
    </View>
  );
}
