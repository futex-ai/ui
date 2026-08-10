/**
 * Categories × categories × value on the sequential ramp — cohort retention,
 * weekday × hour activity, confusion matrices.
 *
 * Distinct from the calendar `Heatmap`, which lays a date range out as weeks.
 * This one is the consumer that justifies the sequential ramp and the
 * `ScaleLegend`.
 */
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { useSharedUiTheme } from "../theme";

import { ChartFrame } from "./ChartFrame";
import { ChartHitLayer } from "./ChartHitLayer";
import { ChartTableView } from "./ChartTableView";
import { rampColor } from "./chartPalette";
import { ScaleLegend } from "./ScaleLegend";
import { normalizeSeries } from "./series/stack";
import { resolveValueFormat } from "./types";

export type MatrixHeatmapProps = {
  /** Column headers, left to right. */
  columns: readonly string[];
  /** Row headers, top to bottom. */
  rows: readonly string[];
  /** `values[rowIndex][columnIndex]`; `null` is "no data", not zero. */
  values: readonly (readonly (number | null)[])[];
  title?: string;
  caption?: string;
  height?: number;
  defaultWidth?: number;
  loading?: boolean;
  valueFormat?: (value: number) => string;
  /** Fix the colour scale rather than deriving it from the data. */
  domain?: readonly [number, number];
  showScaleLegend?: boolean;
  showTableView?: boolean;
  accessibilityLabel?: string;
  disableFocusRing?: boolean;
  onCellPress?: (cell: {
    row: number;
    column: number;
    value: number | null;
  }) => void;
  style?: import("react-native").StyleProp<import("react-native").ViewStyle>;
  testID?: string;
};

const ROW_LABEL_WIDTH = 72;
const COLUMN_LABEL_HEIGHT = 20;

export function MatrixHeatmap({
  columns,
  rows,
  values,
  title,
  caption,
  height = 300,
  defaultWidth,
  loading,
  valueFormat,
  domain,
  showScaleLegend = true,
  showTableView = true,
  accessibilityLabel,
  disableFocusRing,
  onCellPress,
  style,
  testID,
}: MatrixHeatmapProps) {
  const theme = useSharedUiTheme();
  const format = resolveValueFormat(valueFormat);
  const [active, setActive] = useState<number | null>(null);

  const [min, max] = useMemo(() => {
    if (domain) {
      return domain;
    }
    const flat = values
      .flat()
      .filter((v): v is number => v != null && Number.isFinite(v));
    if (flat.length === 0) {
      return [0, 1] as const;
    }
    return [Math.min(...flat), Math.max(...flat)] as const;
  }, [values, domain]);

  const isEmpty = rows.length === 0 || columns.length === 0;

  const tableSeries = useMemo(
    () =>
      normalizeSeries(
        columns.map((column, columnIndex) => ({
          id: column,
          label: column,
          data: rows.map(
            (_, rowIndex) => values[rowIndex]?.[columnIndex] ?? null,
          ),
        })),
        rows.length,
      ),
    [columns, rows, values],
  );

  return (
    <ChartFrame
      accessibilityLabel={accessibilityLabel}
      caption={caption}
      defaultWidth={defaultWidth}
      height={height}
      isEmpty={isEmpty}
      legend={
        showScaleLegend ? (
          <ScaleLegend
            maxLabel={format(max)}
            minLabel={format(min)}
            ramp={theme.charts.sequential}
          />
        ) : null
      }
      legendHeight={showScaleLegend ? 34 : 0}
      loading={loading}
      style={style}
      tableView={
        showTableView ? (
          <ChartTableView
            accessibilityLabel={
              accessibilityLabel
                ? `${accessibilityLabel}, as a table`
                : undefined
            }
            categories={rows}
            series={tableSeries}
            valueFormat={format}
          />
        ) : undefined
      }
      testID={testID}
      title={title}
      xAxisHeight={0}
      yAxisWidth={0}
    >
      {(layout, styles) => {
        const { plot } = layout;
        if (!layout.usable) {
          return null;
        }
        const gridWidth = plot.width - ROW_LABEL_WIDTH;
        const gridHeight = plot.height - COLUMN_LABEL_HEIGHT;
        const cellWidth = gridWidth / Math.max(1, columns.length);
        const cellHeight = gridHeight / Math.max(1, rows.length);
        const span = max - min;

        return (
          <View
            style={{
              height: plot.height,
              left: plot.x,
              position: "absolute",
              top: plot.y,
              width: plot.width,
            }}
          >
            {columns.map((column, index) => (
              <Text
                key={column}
                numberOfLines={1}
                style={[
                  styles.axisLabel,
                  {
                    left: ROW_LABEL_WIDTH + index * cellWidth,
                    position: "absolute",
                    textAlign: "center",
                    top: 0,
                    width: cellWidth,
                  },
                ]}
              >
                {column}
              </Text>
            ))}
            {rows.map((row, rowIndex) => (
              <View key={row}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.axisLabel,
                    {
                      left: 0,
                      position: "absolute",
                      textAlign: "right",
                      top:
                        COLUMN_LABEL_HEIGHT +
                        rowIndex * cellHeight +
                        cellHeight / 2 -
                        7,
                      width: ROW_LABEL_WIDTH - 8,
                    },
                  ]}
                >
                  {row}
                </Text>
                {columns.map((column, columnIndex) => {
                  const value = values[rowIndex]?.[columnIndex] ?? null;
                  return (
                    <View
                      key={column}
                      style={{
                        // `null` shows the empty surface rather than the ramp's
                        // lightest step: "no data" and "near zero" are
                        // different facts and must not look identical.
                        backgroundColor:
                          value == null
                            ? theme.colors.soft
                            : rampColor(
                                span === 0 ? 1 : (value - min) / span,
                                theme.charts.sequential,
                              ),
                        borderRadius: 2,
                        height: Math.max(0, cellHeight - 2),
                        left: ROW_LABEL_WIDTH + columnIndex * cellWidth + 1,
                        position: "absolute",
                        top: COLUMN_LABEL_HEIGHT + rowIndex * cellHeight + 1,
                        width: Math.max(0, cellWidth - 2),
                      }}
                    />
                  );
                })}
              </View>
            ))}
            <ChartHitLayer
              accessibilityLabel={accessibilityLabel}
              activeIndex={active}
              disableFocusRing={disableFocusRing}
              onActivate={(index) => {
                setActive(index);
                const row = Math.floor(index / Math.max(1, columns.length));
                const column = index % Math.max(1, columns.length);
                onCellPress?.({
                  row,
                  column,
                  value: values[row]?.[column] ?? null,
                });
              }}
              onHover={setActive}
              plot={{
                x: ROW_LABEL_WIDTH,
                y: COLUMN_LABEL_HEIGHT,
                width: gridWidth,
                height: gridHeight,
              }}
              targets={rows.flatMap((row, rowIndex) =>
                columns.map((column, columnIndex) => {
                  const value = values[rowIndex]?.[columnIndex] ?? null;
                  return {
                    index: rowIndex * columns.length + columnIndex,
                    label: `${row}, ${column}: ${
                      value == null ? "no data" : format(value)
                    }`,
                    x: columnIndex * cellWidth,
                    y: rowIndex * cellHeight,
                    width: cellWidth,
                    height: cellHeight,
                  };
                }),
              )}
            />
          </View>
        );
      }}
    </ChartFrame>
  );
}
