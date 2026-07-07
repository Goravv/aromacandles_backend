import { ShippingZone } from '../models/index.js';

function parsePincodes(raw) {
  if (!raw) return [];
  try {
    const j = JSON.parse(raw);
    if (Array.isArray(j)) return j.map(String);
  } catch {
    /* comma-separated */
  }
  return String(raw)
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function calculateShippingForPincode(pincode, totalWeightKg) {
  const zones = await ShippingZone.findAll({ order: [['id', 'ASC']] });
  const pc = String(pincode).trim();
  let matched = null;
  for (const z of zones) {
    const list = parsePincodes(z.pincodes);
    if (list.includes(pc) || list.some((p) => pc.startsWith(p))) {
      matched = z;
      break;
    }
  }
  if (!matched) {
    const fallback = zones[0];
    if (!fallback) {
      return { zone: null, cost: 0, message: 'No shipping zone configured' };
    }
    const w = Math.max(0, Number(totalWeightKg) || 0);
    const cost =
      Number(fallback.base_rate) + w * Number(fallback.per_kg_rate);
    return {
      zone: fallback,
      cost: Math.round(cost * 100) / 100,
      message: 'Using default zone (pincode not listed)',
    };
  }
  const w = Math.max(0, Number(totalWeightKg) || 0);
  const cost = Number(matched.base_rate) + w * Number(matched.per_kg_rate);
  return { zone: matched, cost: Math.round(cost * 100) / 100, message: null };
}
