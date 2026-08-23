/**
 * Formats event schedule considering day of week, date and time
 */
export function formatEventDisplayDate(event: { dayOfWeek?: string; date?: string }): string {
  const day = event.dayOfWeek?.trim();
  const date = event.date?.trim();

  if (day && date) {
    // If date already mentions the day of the week, avoid duplication
    if (date.toLowerCase().includes(day.toLowerCase())) {
      return date;
    }
    return `${day}, ${date}`;
  }
  if (day) return day;
  if (date) return date;
  return 'Data a confirmar';
}

export function formatEventFullSchedule(event: { dayOfWeek?: string; date?: string; time?: string }): string {
  const displayDate = formatEventDisplayDate(event);
  if (event.time?.trim()) {
    return `${displayDate} às ${event.time.trim()}`;
  }
  return displayDate;
}
