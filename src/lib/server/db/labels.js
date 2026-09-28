import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { allocateSSCC } from '$lib/server/db/settings';
import { validateSSCC } from '$lib/utils/gs1Utils';
import { db } from '$lib/server/db';
import { logisticLabel } from '$lib/server/db/schema.js';
import { durationSince, recordOperationalEvent } from '$lib/server/analytics/operationalEvents.js';
import { getLabelSizeForPrintLayout } from '$lib/labels/workflows.js';

const MAX_SSCC_ALLOCATION_ATTEMPTS = 100;

export async function createLabel(data, userId, telemetry = {}) {
  ensureDatabase();

  const label = data.sscc
    ? await insertLabel(data, userId, data.sscc)
    : await insertLabelWithAllocatedSSCC(data, userId);

  await recordOperationalEvent({
    eventName: 'label_saved',
    userId,
    operationId: telemetry.operationId,
    labelType: data.label_type,
    labelSize: getLabelSizeForPrintLayout(data.print_layout),
    templateVersion: data.template_version,
    durationMs: telemetry.startedAt ? durationSince(telemetry.startedAt) : undefined
  });

  return toApiLabel(label);
}

async function insertLabelWithAllocatedSSCC(data, userId) {
  for (let attempt = 0; attempt < MAX_SSCC_ALLOCATION_ATTEMPTS; attempt += 1) {
    const sscc = await allocateSSCC(userId);
    const label = await insertLabel(data, userId, sscc, { ignoreSSCCConflict: true });

    if (label) {
      return label;
    }
  }

  const error = new Error(
    'Unable to allocate an unused SSCC. Review the next serial reference in Settings.'
  );
  error.code = 'SSCC_ALLOCATION_FAILED';
  throw error;
}

async function insertLabel(data, userId, sscc, { ignoreSSCCConflict = false } = {}) {
  if (!validateSSCC(sscc)) {
    throw new Error('Invalid SSCC check digit');
  }

  const insert = db.insert(logisticLabel).values({
    userId,
    labelType: data.label_type,
    templateVersion: data.template_version,
    printLayout: data.print_layout,
    gtin: data.gtin || null,
    packagingLevel: data.packaging_level || null,
    lotNumber: data.lot_number || null,
    productionDate: data.production_date || null,
    dateAi: data.date_ai || null,
    dateValue: data.date_value || null,
    quantity: data.quantity ?? null,
    weightPounds: data.weight_pounds == null ? null : String(data.weight_pounds),
    sscc
  });

  const [label] = ignoreSSCCConflict
    ? await insert.onConflictDoNothing({ target: logisticLabel.sscc }).returning()
    : await insert.returning();

  return label || null;
}

export async function updateLabelPrinted(id, filename, userId) {
  ensureDatabase();

  const [label] = await db
    .update(logisticLabel)
    .set({
      printed: true,
      pdfFile: filename,
      pdfPath: filename,
      printedBy: userId,
      printedAt: new Date()
    })
    .where(and(eq(logisticLabel.id, Number(id)), eq(logisticLabel.userId, userId)))
    .returning();

  return label ? toApiLabel(label) : null;
}

export async function getLabelsByUser(userId, page = 1, limit = 10) {
  ensureDatabase();
  return getPagedLabels(userId, page, limit);
}

export async function searchLabels(userId, query, page = 1, limit = 10) {
  ensureDatabase();
  const pattern = `%${query || ''}%`;
  const where = and(
    eq(logisticLabel.userId, userId),
    or(
      ilike(logisticLabel.gtin, pattern),
      ilike(logisticLabel.lotNumber, pattern),
      ilike(logisticLabel.sscc, pattern)
    )
  );

  return getPagedLabels(userId, page, limit, where);
}

export async function getLabelById(id, userId = null) {
  ensureDatabase();
  const where = userId
    ? and(eq(logisticLabel.id, Number(id)), eq(logisticLabel.userId, userId))
    : eq(logisticLabel.id, Number(id));

  const [label] = await db.select().from(logisticLabel).where(where).limit(1);
  return label ? toApiLabel(label) : null;
}

export async function getLabelStats(userId) {
  ensureDatabase();

  const [stats] = await db
    .select({
      totalLabels: count(),
      labelsToday: sql`count(*) filter (where date(${logisticLabel.createdAt}) = current_date)`,
      uniqueGTINs: sql`count(distinct ${logisticLabel.gtin})`,
      lastLabelCreated: sql`max(${logisticLabel.createdAt})`
    })
    .from(logisticLabel)
    .where(eq(logisticLabel.userId, userId));

  const recent = await db
    .select()
    .from(logisticLabel)
    .where(eq(logisticLabel.userId, userId))
    .orderBy(desc(logisticLabel.createdAt))
    .limit(5);

  return {
    stats: {
      totalLabels: Number(stats.totalLabels || 0),
      labelsToday: Number(stats.labelsToday || 0),
      lastLabelCreated: stats.lastLabelCreated?.toISOString?.() || stats.lastLabelCreated || null,
      uniqueGTINs: Number(stats.uniqueGTINs || 0)
    },
    recentLabels: recent.map(toApiLabel)
  };
}

async function getPagedLabels(userId, page, limit, where = eq(logisticLabel.userId, userId)) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
  const offset = (safePage - 1) * safeLimit;

  const [{ value: total }] = await db.select({ value: count() }).from(logisticLabel).where(where);
  const rows = await db
    .select()
    .from(logisticLabel)
    .where(where)
    .orderBy(desc(logisticLabel.createdAt))
    .limit(safeLimit)
    .offset(offset);

  return {
    labels: rows.map(toApiLabel),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.max(1, Math.ceil(total / safeLimit))
    }
  };
}

function toApiLabel(label) {
  return {
    id: label.id,
    user_id: label.userId,
    label_type: label.labelType,
    template_version: label.templateVersion,
    print_layout: label.printLayout,
    gtin: label.gtin,
    packaging_level: label.packagingLevel,
    lot_number: label.lotNumber,
    production_date: label.productionDate,
    date_ai: label.dateAi,
    date_value: label.dateValue,
    quantity: label.quantity,
    weight_pounds: label.weightPounds == null ? null : Number(label.weightPounds),
    sscc: label.sscc,
    created_at: label.createdAt?.toISOString?.() || label.createdAt,
    printed: label.printed,
    pdf_file: label.pdfFile,
    pdf_path: label.pdfPath,
    printed_by: label.printedBy,
    printed_at: label.printedAt?.toISOString?.() || label.printedAt
  };
}

function ensureDatabase() {
  if (!db) {
    throw new Error('Database is not configured. Set LOGISTIC_LABEL_DATABASE_URL.');
  }
}

export default {
  createLabel,
  updateLabelPrinted,
  getLabelsByUser,
  searchLabels,
  getLabelById,
  getLabelStats
};
