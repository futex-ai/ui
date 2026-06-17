/**
 * Public surface for `@firna/ui/calendar`: the pure datetime/recurrence/layout
 * modules, the style factory, every view + component, and the drag-to-create
 * hook. The hook is re-exported by its bare path so platform resolution picks
 * the `.web` implementation on web and the no-op `.ts` on native.
 */
export * from "./types";
export * from "./calendarMath";
export * from "./recurrence";
export * from "./eventLayout";
export * from "./calendarStyles";
export * from "./CalendarView";
export * from "./CalendarToolbar";
export * from "./MonthView";
export * from "./WeekView";
export * from "./DayView";
export * from "./AgendaView";
export * from "./TimeGrid";
export * from "./CalendarEventBlock";
export * from "./CalendarEventChip";
export { useCalendarDragCreate } from "./useCalendarDragCreate";
export type { CalendarDragCreate } from "./useCalendarDragCreate";
export { useCalendarMonthDragCreate } from "./useCalendarMonthDragCreate";
export type { CalendarMonthDragCreate } from "./useCalendarMonthDragCreate";
