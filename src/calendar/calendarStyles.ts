/** Shared styles for the calendar family (toolbar, month grid, time grid, agenda). */
import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

/**
 * Style factory for every calendar view. Mirrors the look/idioms of
 * `src/date/webCalendarStyles.ts`: a single `StyleSheet.create` object keyed by
 * intent, all colours/fonts/radii read from theme tokens (no hard-coded brand
 * colours). Component files compose these with inline geometry (heights derived
 * from `pxPerHour`, column widths from concurrency) where the layout is dynamic.
 */
export function createCalendarStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    // --- root container ----------------------------------------------------
    root: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.xl,
      borderWidth: 1,
      overflow: "hidden",
    },

    // --- toolbar -----------------------------------------------------------
    toolbar: {
      alignItems: "center",
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    toolbarLeft: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      minWidth: 0,
    },
    toolbarRight: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    toolbarTitle: {
      ...baseText,
      color: theme.colors.ink,
      flexShrink: 1,
      fontSize: 15,
      fontWeight: "700",
    },
    // Square icon buttons for prev/next.
    navButton: {
      alignItems: "center",
      borderColor: theme.colors.border2,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      height: 28,
      justifyContent: "center",
      width: 28,
    },
    navButtonHover: { backgroundColor: theme.colors.soft },
    // Text "Today" button.
    todayButton: {
      alignItems: "center",
      borderColor: theme.colors.border2,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      justifyContent: "center",
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    todayButtonHover: { backgroundColor: theme.colors.soft },
    todayButtonText: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 13,
      fontWeight: "700",
    },

    // --- month grid --------------------------------------------------------
    // `userSelect: none` so a drag-to-create gesture sweeps cells without the
    // browser text-selecting the day numbers, event labels, and "+N more".
    monthGrid: { flexGrow: 1, userSelect: "none" },
    // Weekday header row (Sun..Sat labels).
    monthWeekdayRow: {
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
    },
    monthWeekdayCell: {
      flex: 1,
      paddingVertical: 6,
    },
    monthWeekdayText: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 11,
      fontWeight: "700",
      textAlign: "center",
      textTransform: "uppercase",
    },
    // A single week row of seven day cells.
    monthWeekRow: {
      flex: 1,
      flexDirection: "row",
      minHeight: 96,
    },
    // One day cell.
    monthDayCell: {
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      borderRightColor: theme.colors.border,
      borderRightWidth: 1,
      flex: 1,
      minWidth: 0,
      paddingBottom: 4,
      paddingHorizontal: 4,
      paddingTop: 4,
    },
    // Strip the trailing edge so the grid's own border isn't doubled.
    monthDayCellLast: { borderRightWidth: 0 },
    // Cells from the previous/next month read back.
    monthDayCellOutside: { backgroundColor: theme.colors.bg },
    monthDayCellHover: { backgroundColor: theme.colors.soft },
    // A cell inside the in-progress drag-to-create range.
    monthDayCellSelected: { backgroundColor: theme.colors.primarySoft },
    // Day-number row at the top of the cell.
    monthDayHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingBottom: 2,
    },
    monthDayNumber: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
    },
    monthDayNumberOutside: { color: theme.colors.faint },
    // Today marker: a filled pill behind the day number.
    monthTodayMarker: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.pill,
      height: 22,
      justifyContent: "center",
      minWidth: 22,
      paddingHorizontal: 4,
    },
    monthTodayNumber: { color: theme.colors.surface, fontWeight: "700" },
    // Vertical stack of chips / spanning bars within a cell.
    monthCellChips: { gap: 2 },

    // --- chips (month / agenda spanning + single bars) ---------------------
    chip: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.sm,
      justifyContent: "center",
      overflow: "hidden",
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    chipText: {
      ...baseText,
      color: theme.colors.surface,
      fontSize: 11,
      fontWeight: "600",
    },
    // A dot + text chip used for short timed events in the month cell.
    chipDot: {
      alignItems: "center",
      flexDirection: "row",
      gap: 5,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    chipDotMarker: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.pill,
      height: 7,
      width: 7,
    },
    chipDotText: {
      ...baseText,
      color: theme.colors.ink2,
      flexShrink: 1,
      fontSize: 11,
      fontWeight: "600",
    },

    // --- "+N more" overflow ------------------------------------------------
    moreButton: {
      borderRadius: theme.radii.sm,
      justifyContent: "center",
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    moreButtonHover: { backgroundColor: theme.colors.soft },
    moreText: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 11,
      fontWeight: "700",
    },

    // --- time grid (week + day) -------------------------------------------
    // The whole grid wrapper (date header + all-day row + scrollable body).
    // `userSelect: none` so a vertical drag-to-create never text-selects the
    // hour labels / event blocks.
    timeGrid: { flexGrow: 1, minHeight: 0, userSelect: "none" },
    // Fixed date header above the grid: one cell per day column (weekday + day
    // number), aligned with the columns by a left gutter spacer.
    timeHeaderRow: {
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
    },
    timeHeaderGutter: {
      borderRightColor: theme.colors.border,
      borderRightWidth: 1,
      width: 56,
    },
    timeHeaderCell: {
      alignItems: "center",
      borderRightColor: theme.colors.border,
      borderRightWidth: 1,
      flex: 1,
      gap: 2,
      minWidth: 0,
      paddingVertical: 6,
    },
    timeHeaderCellLast: { borderRightWidth: 0 },
    timeHeaderWeekday: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    timeHeaderDay: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 16,
      fontWeight: "600",
    },
    // A filled pill around today's number (Google's "today" circle).
    timeHeaderTodayBadge: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.pill,
      height: 26,
      justifyContent: "center",
      minWidth: 26,
      paddingHorizontal: 5,
    },
    timeHeaderTodayDay: { color: theme.colors.surface },
    // Scrollable body holding the hour rows + day columns.
    timeGridBody: { flexGrow: 1 },
    // Inner content row: gutter on the left, the day columns on the right.
    timeGridContent: { flexDirection: "row" },
    // Hour-label gutter on the left edge.
    timeGutter: {
      borderRightColor: theme.colors.border,
      borderRightWidth: 1,
      width: 56,
    },
    // One hour slot in the gutter; label sits at the top edge of the line.
    timeGutterHour: {
      alignItems: "flex-end",
      paddingRight: 6,
    },
    timeGutterLabel: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 11,
      // Pull the label up so it straddles the hour line rather than sitting
      // below it (matches Google's gutter).
      transform: [{ translateY: -6 }],
    },
    // The columns area (all day columns side by side), relative for absolute
    // event blocks / now-line.
    timeColumns: {
      flexDirection: "row",
      flexGrow: 1,
      position: "relative",
    },
    // A single day column.
    timeColumn: {
      borderRightColor: theme.colors.border,
      borderRightWidth: 1,
      flex: 1,
      minWidth: 0,
      position: "relative",
    },
    timeColumnLast: { borderRightWidth: 0 },
    timeColumnToday: { backgroundColor: theme.colors.primarySoft },
    // Horizontal hour line drawn at each hour boundary inside a column.
    hourLine: {
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      left: 0,
      position: "absolute",
      right: 0,
    },
    // A lighter half-hour line.
    halfHourLine: {
      borderTopColor: theme.colors.bg2,
      borderTopWidth: 1,
      left: 0,
      position: "absolute",
      right: 0,
    },

    // --- all-day row (top of the time grid) --------------------------------
    allDayRow: {
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      minHeight: 28,
    },
    // The gutter label cell to the left of the all-day lane.
    allDayGutter: {
      alignItems: "flex-end",
      borderRightColor: theme.colors.border,
      borderRightWidth: 1,
      justifyContent: "center",
      paddingRight: 6,
      paddingVertical: 4,
      width: 56,
    },
    allDayGutterText: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    // The lane holding the all-day bars across the day columns.
    allDayLane: {
      flexDirection: "row",
      flexGrow: 1,
      paddingVertical: 3,
      position: "relative",
    },
    allDayCell: {
      borderRightColor: theme.colors.border,
      borderRightWidth: 1,
      flex: 1,
      gap: 2,
      minWidth: 0,
      paddingHorizontal: 2,
    },
    allDayCellLast: { borderRightWidth: 0 },

    // --- now-line ----------------------------------------------------------
    nowLine: {
      backgroundColor: theme.colors.rose,
      height: 2,
      left: 0,
      position: "absolute",
      right: 0,
      zIndex: 5,
    },
    // The round knob on the left end of the now-line.
    nowLineKnob: {
      backgroundColor: theme.colors.rose,
      borderRadius: theme.radii.pill,
      height: 8,
      left: -4,
      position: "absolute",
      top: -3,
      width: 8,
    },

    // --- event block (positioned timed block) ------------------------------
    eventBlock: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.sm,
      overflow: "hidden",
      paddingHorizontal: 5,
      paddingVertical: 2,
      position: "absolute",
    },
    eventBlockTitle: {
      ...baseText,
      color: theme.colors.surface,
      fontSize: 11,
      fontWeight: "700",
    },
    eventBlockTime: {
      ...baseText,
      color: theme.colors.surface,
      fontSize: 10,
      // Full-opacity white keeps the time text ≥4.5:1 on the primary event fill
      // (WCAG 2.1 — 1.4.3 Contrast). White at 0.9 composites to ~4.41:1.
    },

    // --- drag ghost (in-progress drag-to-create) ---------------------------
    dragGhost: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
      borderRadius: theme.radii.sm,
      borderStyle: "dashed",
      borderWidth: 1,
      position: "absolute",
      zIndex: 6,
    },
    dragGhostText: {
      ...baseText,
      color: theme.colors.primaryDeep,
      fontSize: 10,
      fontWeight: "700",
      paddingHorizontal: 5,
      paddingTop: 2,
    },

    // --- agenda ------------------------------------------------------------
    agenda: { flexGrow: 1 },
    agendaScroll: { flexGrow: 1 },
    agendaContent: { padding: 12 },
    // Day group header (e.g. "Tue 17 Jun").
    agendaDayHeader: {
      alignItems: "baseline",
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: 8,
      marginTop: 14,
      paddingBottom: 4,
    },
    agendaDayHeaderFirst: { marginTop: 0 },
    agendaDayWeekday: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    agendaDayDate: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 14,
      fontWeight: "700",
    },
    agendaDayToday: { color: theme.colors.primaryDeep },
    // One event row inside a day group.
    agendaRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
      paddingVertical: 6,
    },
    agendaRowHover: { backgroundColor: theme.colors.soft },
    // Colour dot leading each row.
    agendaDot: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.pill,
      height: 8,
      width: 8,
    },
    agendaTime: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 12,
      fontVariant: ["tabular-nums"],
      width: 132,
    },
    agendaTitle: {
      ...baseText,
      color: theme.colors.ink,
      flexShrink: 1,
      fontSize: 13,
      fontWeight: "600",
    },
    // Empty state when the agenda window has no events.
    agendaEmpty: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
    },
    agendaEmptyText: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 13,
      textAlign: "center",
    },
  });
}

/** The resolved style sheet produced by {@link createCalendarStyles}. */
export type CalendarStyles = ReturnType<typeof createCalendarStyles>;
