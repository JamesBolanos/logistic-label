export function parseAnalyticsUserIds(value: string | null | undefined): string[] {
  return [
    ...new Set(
      String(value || '')
        .split(',')
        .map((userId) => userId.trim())
        .filter(Boolean)
    )
  ];
}

export function isConfiguredAnalyticsOwner(
  userId: string | null | undefined,
  configuredUserIds: string | null | undefined
): boolean {
  return Boolean(userId && parseAnalyticsUserIds(configuredUserIds).includes(userId));
}

export function combineAnalyticsUserIds(
  ...configuredLists: Array<string | null | undefined>
): string[] {
  return [...new Set(configuredLists.flatMap(parseAnalyticsUserIds))];
}
