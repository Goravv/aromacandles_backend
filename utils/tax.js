import { Setting } from '../models/index.js';

let cachedGst = null;
let cachedAt = 0;
const TTL = 60_000;

export async function getGstRatePercent() {
  const envRate = process.env.GST_RATE_PERCENT;
  if (envRate != null && envRate !== '') {
    return Number(envRate);
  }
  if (Date.now() - cachedAt < TTL && cachedGst != null) {
    return cachedGst;
  }
  const row = await Setting.findOne({ where: { key: 'gst_rate_percent' } });
  const v = row?.value != null ? Number(row.value) : 18;
  cachedGst = Number.isFinite(v) ? v : 18;
  cachedAt = Date.now();
  return cachedGst;
}

export function calculateGst(amountExcludingGst, ratePercent) {
  const r = Number(ratePercent) / 100;
  const gst = Math.round(amountExcludingGst * r * 100) / 100;
  return gst;
}
