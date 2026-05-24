// src/lib/server/db/labels.js
import { generateSSCC } from '$lib/utils/gs1Utils';

const labels = [];

export async function createLabel(data, userId) {
  const id = labels.length + 1;
  const label = {
    id,
    user_id: userId,
    gtin: data.gtin,
    lot_number: data.lot_number,
    production_date: data.production_date,
    quantity: data.quantity,
    weight_pounds: data.weight_pounds,
    sscc: data.sscc || generateSSCC(),
    created_at: new Date().toISOString(),
    printed: false,
    pdf_file: null
  };
  labels.push(label);
  return label;
}

export async function updateLabelPrinted(id, filename, userId) {
  const label = labels.find((l) => l.id === id);
  if (label) {
    label.printed = true;
    label.pdf_file = filename;
    label.printed_by = userId;
  }
  return label;
}

export async function getLabelsByUser(userId) {
  return labels.filter((l) => l.user_id === userId);
}

export async function searchLabels(userId, query) {
  const q = (query || '').toLowerCase();
  return labels.filter((l) => l.user_id === userId && (
    l.gtin.toLowerCase().includes(q) ||
    l.lot_number.toLowerCase().includes(q)
  ));
}

export async function getLabelById(id) {
  return labels.find((l) => l.id === Number(id)) || null;
}

export default {
  createLabel,
  updateLabelPrinted,
  getLabelsByUser,
  searchLabels,
  getLabelById
};
