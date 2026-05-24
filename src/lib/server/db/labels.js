import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { generateSSCC } from '$lib/utils/gs1Utils';
import { db } from '$lib/server/db';
import { logisticLabel } from '$lib/server/db/schema.js';

export async function createLabel(data, userId) {
  ensureDatabase();

  const [label] = await db
    .insert(logisticLabel)
    .values({
      userId,
      gtin: data.gtin,
      lotNumber: data.lot_number,
      productionDate: data.production_date,
      quantity: data.quantity,
      weightPounds: String(data.weight_pounds),
      sscc: data.sscc || generateSSCC()
    })
    .returning();

  return toApiLabel(label);
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
    gtin: label.gtin,
    lot_number: label.lotNumber,
    production_date: label.productionDate,
    quantity: label.quantity,
    weight_pounds: Number(label.weightPounds),
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
