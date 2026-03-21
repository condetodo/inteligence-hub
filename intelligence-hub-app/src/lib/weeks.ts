import { startOfISOWeek, endOfISOWeek, getISOWeek, getISOWeekYear, addWeeks, subWeeks, format } from "date-fns";
import { es } from "date-fns/locale";

export function getCurrentWeek() {
  const now = new Date();
  return { weekNumber: getISOWeek(now), year: getISOWeekYear(now) };
}

export function getWeekDates(year: number, weekNumber: number) {
  const jan4 = new Date(year, 0, 4);
  const weekStart = startOfISOWeek(jan4);
  const target = addWeeks(weekStart, weekNumber - 1);
  return {
    start: startOfISOWeek(target),
    end: endOfISOWeek(target),
  };
}

export function formatWeekLabel(year: number, weekNumber: number): string {
  const { start, end } = getWeekDates(year, weekNumber);
  const startStr = format(start, "d MMM", { locale: es });
  const endStr = format(end, "d MMM yyyy", { locale: es });
  return `Semana ${weekNumber} · ${startStr}-${endStr}`;
}

export function prevWeek(year: number, weekNumber: number) {
  const { start } = getWeekDates(year, weekNumber);
  const prev = subWeeks(start, 1);
  return { weekNumber: getISOWeek(prev), year: getISOWeekYear(prev) };
}

export function nextWeek(year: number, weekNumber: number) {
  const { start } = getWeekDates(year, weekNumber);
  const next = addWeeks(start, 1);
  return { weekNumber: getISOWeek(next), year: getISOWeekYear(next) };
}
