import { and, count, countDistinct, eq, gte, inArray, lt, min, notInArray } from 'drizzle-orm';
import { createRollingWindow, percentage } from '$lib/analytics/statistics.js';
import { getAnalyticsExcludedUserIds } from '$lib/server/analytics/access.js';
import { db } from '$lib/server/db';
import { labelSettings, logisticLabel, operationalEvent, user } from '$lib/server/db/schema.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getOwnerStatistics(days, now = new Date()) {
  ensureDatabase();

  const { start, end } = createRollingWindow(days, now);
  const weeklyStart = new Date(end.getTime() - 7 * DAY_MS);
  const excludedUserIds = getAnalyticsExcludedUserIds();
  const userExclusion = excludeConfiguredUsers(user.id, excludedUserIds);
  const labelExclusion = excludeConfiguredUsers(logisticLabel.userId, excludedUserIds);
  const eventExclusion = excludeConfiguredUsers(operationalEvent.userId, excludedUserIds);

  const [
    [newUsers],
    firstLabelRows,
    [weeklyCreators],
    [failedAttempts],
    failureRows,
    [eventCoverage]
  ] = await Promise.all([
    db
      .select({ value: countDistinct(user.id) })
      .from(user)
      .where(and(gte(user.createdAt, start), lt(user.createdAt, end), userExclusion)),
    db
      .select({
        userId: logisticLabel.userId,
        firstLabelAt: min(logisticLabel.createdAt)
      })
      .from(logisticLabel)
      .where(labelExclusion)
      .groupBy(logisticLabel.userId),
    db
      .select({ value: countDistinct(logisticLabel.userId) })
      .from(logisticLabel)
      .where(
        and(
          gte(logisticLabel.createdAt, weeklyStart),
          lt(logisticLabel.createdAt, end),
          labelExclusion
        )
      ),
    db
      .select({
        attempts: count(),
        affectedUsers: countDistinct(operationalEvent.userId)
      })
      .from(operationalEvent)
      .where(
        and(
          eq(operationalEvent.eventName, 'workflow_failed'),
          eq(operationalEvent.isInternal, false),
          gte(operationalEvent.createdAt, start),
          lt(operationalEvent.createdAt, end),
          eventExclusion
        )
      ),
    db
      .select({
        category: operationalEvent.errorCategory,
        attempts: count(),
        affectedUsers: countDistinct(operationalEvent.userId)
      })
      .from(operationalEvent)
      .where(
        and(
          eq(operationalEvent.eventName, 'workflow_failed'),
          eq(operationalEvent.isInternal, false),
          gte(operationalEvent.createdAt, start),
          lt(operationalEvent.createdAt, end),
          eventExclusion
        )
      )
      .groupBy(operationalEvent.errorCategory),
    db
      .select({ firstEventAt: min(operationalEvent.createdAt) })
      .from(operationalEvent)
      .where(and(eq(operationalEvent.isInternal, false), eventExclusion))
  ]);

  const firstLabelUsers = firstLabelRows.filter(({ firstLabelAt }) =>
    isWithinWindow(firstLabelAt, start, end)
  ).length;
  const funnel = await getSignupFunnel({ start, end, now, excludedUserIds });

  return {
    days,
    window: {
      start: start.toISOString(),
      end: end.toISOString(),
      timeZone: 'America/Managua'
    },
    configuration: {
      excludedUserCount: excludedUserIds.length
    },
    summary: {
      newUsers: Number(newUsers?.value || 0),
      firstLabelUsers,
      weeklyCreators: Number(weeklyCreators?.value || 0),
      failedAttempts: Number(failedAttempts?.attempts || 0),
      affectedUsers: Number(failedAttempts?.affectedUsers || 0),
      customInquiries: null,
      acceptedProjects: null
    },
    funnel,
    failures: failureRows
      .map((row) => ({
        category: row.category || 'unexpected',
        attempts: Number(row.attempts || 0),
        affectedUsers: Number(row.affectedUsers || 0)
      }))
      .sort((first, second) => second.attempts - first.attempts),
    dataCoverageStart: toIso(eventCoverage?.firstEventAt)
  };
}

async function getSignupFunnel({ start, end, now, excludedUserIds }) {
  const eligibleEnd = new Date(Math.min(end.getTime(), now.getTime() - DAY_MS));

  if (eligibleEnd <= start) {
    return emptyFunnel();
  }

  const cohort = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(
        gte(user.createdAt, start),
        lt(user.createdAt, eligibleEnd),
        excludeConfiguredUsers(user.id, excludedUserIds)
      )
    );
  const cohortUserIds = cohort.map(({ id }) => id);

  if (cohortUserIds.length === 0) {
    return emptyFunnel();
  }

  const [settingsUsers, previewUsers, labelUsers, pdfUsers] = await Promise.all([
    db
      .selectDistinct({ userId: labelSettings.userId })
      .from(labelSettings)
      .where(and(inArray(labelSettings.userId, cohortUserIds), lt(labelSettings.createdAt, end))),
    db
      .selectDistinct({ userId: operationalEvent.userId })
      .from(operationalEvent)
      .where(
        and(
          inArray(operationalEvent.userId, cohortUserIds),
          eq(operationalEvent.eventName, 'label_preview_succeeded'),
          eq(operationalEvent.isInternal, false),
          lt(operationalEvent.createdAt, end)
        )
      ),
    db
      .selectDistinct({ userId: logisticLabel.userId })
      .from(logisticLabel)
      .where(and(inArray(logisticLabel.userId, cohortUserIds), lt(logisticLabel.createdAt, end))),
    db
      .selectDistinct({ userId: operationalEvent.userId })
      .from(operationalEvent)
      .where(
        and(
          inArray(operationalEvent.userId, cohortUserIds),
          eq(operationalEvent.eventName, 'pdf_response_succeeded'),
          eq(operationalEvent.isInternal, false),
          lt(operationalEvent.createdAt, end)
        )
      )
  ]);

  const total = cohortUserIds.length;
  return [
    funnelStep('Eligible signups', total, total),
    funnelStep('Company settings saved', settingsUsers.length, total),
    funnelStep('Label preview succeeded', previewUsers.length, total),
    funnelStep('First label saved', labelUsers.length, total),
    funnelStep('PDF response succeeded', pdfUsers.length, total)
  ];
}

function emptyFunnel() {
  return [
    funnelStep('Eligible signups', 0, 0),
    funnelStep('Company settings saved', 0, 0),
    funnelStep('Label preview succeeded', 0, 0),
    funnelStep('First label saved', 0, 0),
    funnelStep('PDF response succeeded', 0, 0)
  ];
}

function funnelStep(label, value, total) {
  return { label, value, percentage: percentage(value, total) };
}

function excludeConfiguredUsers(column, excludedUserIds) {
  return excludedUserIds.length > 0 ? notInArray(column, excludedUserIds) : undefined;
}

function isWithinWindow(value, start, end) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  return date >= start && date < end;
}

function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function ensureDatabase() {
  if (!db) {
    throw new Error('Database is not configured. Set LOGISTIC_LABEL_DATABASE_URL.');
  }
}
