import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';

export function formatNoteDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) return format(date, "'Today at' h:mm a");
  if (isThisWeek(date, { weekStartsOn: 0 })) return format(date, 'EEEE');
  if (isThisMonth(date)) return format(date, 'MMM d');
  return format(date, 'MMM d, yyyy');
}

export function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfThisWeek(): number {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfThisMonth(): number {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
