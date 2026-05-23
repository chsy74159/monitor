export function floorToHour(date: Date): Date {
  const rounded = new Date(date);
  rounded.setUTCMinutes(0, 0, 0);
  return rounded;
}

export function previousHourWindow(now = new Date()): { windowStart: string; windowEnd: string } {
  const windowEnd = floorToHour(now);
  const windowStart = new Date(windowEnd);
  windowStart.setUTCHours(windowStart.getUTCHours() - 1);

  return {
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString()
  };
}
