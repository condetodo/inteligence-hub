export type PeriodType = 'WEEKLY' | 'MONTHLY';

interface PeriodRange {
  start: Date;
  end: Date;
  periodNumber: number;
  year: number;
}

export function getCurrentPeriodRange(periodType: PeriodType): PeriodRange {
  const now = new Date();
  const year = now.getFullYear();

  if (periodType === 'MONTHLY') {
    const start = new Date(year, now.getMonth(), 1);
    const end = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end, periodNumber: now.getMonth() + 1, year };
  }

  // WEEKLY — ISO week (Monday to Sunday)
  const day = now.getDay() || 7; // Convert Sunday=0 to 7
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // ISO week number
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return { start: monday, end: sunday, periodNumber: weekNumber, year };
}
