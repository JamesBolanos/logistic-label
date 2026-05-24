// src/lib/server/db/neon.js
// Lightweight in-memory stub that mimics a Postgres client with a query method.

const data = {
  logistic_labels: []
};

function rowsFromQuery(query, params) {
  const userId = params?.[0];

  // COUNT(*)
  if (query.includes('COUNT(*)') && query.includes('DATE(created_at) = CURRENT_DATE')) {
    const count = data.logistic_labels.filter((l) => l.user_id === userId && sameDay(l.created_at, new Date())).length;
    return [{ count }];
  }

  if (query.includes('COUNT(*)')) {
    const count = data.logistic_labels.filter((l) => l.user_id === userId).length;
    return [{ count }];
  }

  // DISTINCT gtin
  if (query.includes('DISTINCT gtin')) {
    const set = new Set(data.logistic_labels.filter((l) => l.user_id === userId).map((l) => l.gtin));
    return [{ count: set.size }];
  }

  // ORDER BY created_at
  if (query.includes('ORDER BY created_at')) {
    return data.logistic_labels
      .filter((l) => l.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map((l) => ({ id: l.id, gtin: l.gtin, lot_number: l.lot_number, created_at: l.created_at }));
  }

  // Last label created
  if (query.includes('LIMIT 1') && query.includes('ORDER BY created_at DESC')) {
    const item = data.logistic_labels
      .filter((l) => l.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    return item ? [{ created_at: item.created_at }] : [];
  }

  return [];
}

function sameDay(a, b) {
  const da = new Date(a);
  return da.getFullYear() === b.getFullYear() && da.getMonth() === b.getMonth() && da.getDate() === b.getDate();
}

const db = {
  async query(sql, params = []) {
    return { rows: rowsFromQuery(sql, params) };
  }
};

export default db;
