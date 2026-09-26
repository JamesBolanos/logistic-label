export const REPORTING_WINDOWS = [7, 30] as const;

export type ReportingDays = (typeof REPORTING_WINDOWS)[number];

export function resolveReportingDays(value: string | number | null | undefined): ReportingDays {
  const days = Number(value);
  return REPORTING_WINDOWS.includes(days as ReportingDays) ? (days as ReportingDays) : 30;
}

export function createRollingWindow(days: ReportingDays, now = new Date()) {
  const end = new Date(now);
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  return { start, end };
}

export function percentage(count: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((count / total) * 1000) / 10;
}
