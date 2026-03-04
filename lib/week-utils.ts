import { startOfWeek, addDays, endOfWeek, formatISO } from "date-fns";

export function getIsoWeekStart(date = new Date()) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getIsoWeekEnd(date = new Date()) {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function getIsoWeekRange(date = new Date()) {
  return {
    start: getIsoWeekStart(date),
    end: getIsoWeekEnd(date)
  };
}

export function getDayKeysBetween(start: Date, end: Date) {
  const keys: string[] = [];
  const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i <= diff; i += 1) {
    keys.push(formatISO(addDays(start, i), { representation: "date" }));
  }

  return keys;
}

export function toUtcDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}