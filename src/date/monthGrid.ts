/**
 * The Monday-first month grid behind the calendar picker: rows of seven day
 * cells, padded with the adjacent months' days. Pure and timezone-safe, like
 * the helpers in `dateMath`.
 */
import { addDays, daysInMonth, parseIso, toIso } from "./dateMath";

/** One calendar grid cell. `inMonth` is false for leading/trailing days. */
export type DayCell = { iso: string; day: number; inMonth: boolean };

/** Options for {@link buildMonthGrid}. */
export type MonthGridOptions = {
  /**
   * Always return six weeks, padding with the next month's days, so every
   * month lays out at the same height. Without it the grid has only the four
   * to six weeks the month spans.
   */
  fixedWeeks?: boolean;
};

/** Weeks in a fixed grid: the most any month can span. */
const FIXED_WEEKS = 6;

/**
 * Build a Monday-first month grid as rows of seven cells. Leading/trailing cells
 * are the adjacent months' days with `inMonth: false`. Every cell carries its
 * full ISO date so selection and keyboard navigation work across boundaries.
 */
export function buildMonthGrid(
  year: number,
  month: number,
  { fixedWeeks = false }: MonthGridOptions = {},
): DayCell[][] {
  const lead = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const total = daysInMonth(year, month);
  const startIso = toIso({ year, month, day: 1 });
  const minCells = fixedWeeks ? FIXED_WEEKS * 7 : 0;
  const cells: DayCell[] = [];
  let offset = -lead;
  while (offset < total || cells.length % 7 !== 0 || cells.length < minCells) {
    const iso = addDays(startIso, offset);
    const parts = parseIso(iso);
    if (!parts) {
      break;
    }
    cells.push({ iso, day: parts.day, inMonth: parts.month === month });
    offset += 1;
  }
  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
