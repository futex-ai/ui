/** Read-only cell renderers, field-type icons, and the option color palette. */
import {
  Calendar,
  Hash,
  List,
  type LucideIcon,
  Tags,
  Type,
} from "lucide-react-native";
import { Text, View } from "react-native";

import type { SharedUiTheme } from "../theme";

import type { DataGridStyles } from "./dataGridStyles";
import type {
  DataGridColumn,
  DataGridFieldType,
  DataGridOptionColor,
  DataGridCellValue,
} from "./types";

/** The lucide icon shown beside a column's header for its field type. */
export function fieldTypeIcon(type: DataGridFieldType): LucideIcon {
  switch (type) {
    case "number":
      return Hash;
    case "date":
      return Calendar;
    case "singleSelect":
      return List;
    case "multiSelect":
      return Tags;
    default:
      return Type;
  }
}

/** Human label for a field type, used in the add-column picker. */
export function fieldTypeLabel(type: DataGridFieldType): string {
  switch (type) {
    case "number":
      return "Number";
    case "date":
      return "Date";
    case "singleSelect":
      return "Single select";
    case "multiSelect":
      return "Multi-select";
    default:
      return "Text";
  }
}

type ColorPair = { backgroundColor: string; color: string };

/**
 * Resolve a select option's color to an AA-contrast background/text pair. Green,
 * amber, rose and gray reuse the theme's verified soft/deep tokens; blue, purple
 * and teal use fixed pairs held to ≥4.5:1 (WCAG 2.1 — 1.4.3, AA).
 */
export function resolveOptionColor(
  theme: SharedUiTheme,
  color: DataGridOptionColor = "gray",
): ColorPair {
  switch (color) {
    case "green":
      return {
        backgroundColor: theme.colors.primarySoft,
        color: theme.colors.primaryDeep,
      };
    case "amber":
      return {
        backgroundColor: theme.colors.amberSoft,
        color: theme.colors.amberDeep,
      };
    case "rose":
      return {
        backgroundColor: theme.colors.roseSoft,
        color: theme.colors.roseDeep,
      };
    case "blue":
      return { backgroundColor: "#dbe7f3", color: "#2c557f" };
    case "purple":
      return { backgroundColor: "#ebe5f9", color: "#4a3795" };
    case "teal":
      return { backgroundColor: "#d6ede7", color: "#1b6052" };
    default:
      return { backgroundColor: theme.colors.soft, color: theme.colors.ink2 };
  }
}

/** A single colored option pill. */
export function OptionPill({
  colors,
  label,
  fontSize,
}: {
  colors: ColorPair;
  label: string;
  fontSize: number;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.backgroundColor,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 1,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          color: colors.color,
          fontSize: fontSize - 1,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/** Format an ISO `YYYY-MM-DD` value as e.g. "4 Mar 2026"; passthrough otherwise. */
export function formatDateValue(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    return iso;
  }
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const [, year, month, day] = match;
  const monthLabel = months[Number(month) - 1] ?? month;
  return `${Number(day)} ${monthLabel} ${year}`;
}

function optionLabel(column: DataGridColumn, id: string): string {
  return column.options?.find((option) => option.id === id)?.label ?? id;
}

function optionColor(
  column: DataGridColumn,
  id: string,
): DataGridOptionColor | undefined {
  return column.options?.find((option) => option.id === id)?.color;
}

/** Render a cell's read-only content for its column's field type. */
export function DataGridCellContent({
  column,
  value,
  styles,
  theme,
  fontSize,
}: {
  column: DataGridColumn;
  value: DataGridCellValue;
  styles: DataGridStyles;
  theme: SharedUiTheme;
  fontSize: number;
}) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  switch (column.fieldType) {
    case "number":
      return (
        <Text numberOfLines={1} style={[styles.cellText, styles.cellNumeric]}>
          {String(value)}
        </Text>
      );
    case "date":
      return (
        <Text numberOfLines={1} style={styles.cellText}>
          {formatDateValue(String(value))}
        </Text>
      );
    case "singleSelect": {
      const id = String(value);
      return (
        <OptionPill
          colors={resolveOptionColor(theme, optionColor(column, id))}
          fontSize={fontSize}
          label={optionLabel(column, id)}
        />
      );
    }
    case "multiSelect": {
      const ids = Array.isArray(value) ? value : [];
      return (
        <View style={[styles.pillRow, { overflow: "hidden" }]}>
          {ids.map((id) => (
            <OptionPill
              colors={resolveOptionColor(theme, optionColor(column, id))}
              fontSize={fontSize}
              key={id}
              label={optionLabel(column, id)}
            />
          ))}
        </View>
      );
    }
    default:
      return (
        <Text numberOfLines={1} style={styles.cellText}>
          {String(value)}
        </Text>
      );
  }
}
