import { ShippingZone } from '../models/index.js';

export async function adminList(req, res) {
  const rows = await ShippingZone.findAll({ order: [['zone_name', 'ASC']] });
  res.json({ zones: rows });
}

export async function adminCreate(req, res) {
  const z = await ShippingZone.create(req.body);
  res.status(201).json({ zone: z });
}

export async function adminUpdate(req, res) {
  const z = await ShippingZone.findByPk(req.params.id);
  if (!z) return res.status(404).json({ message: 'Not found' });
  await z.update(req.body);
  res.json({ zone: z });
}

export async function adminDelete(req, res) {
  const z = await ShippingZone.findByPk(req.params.id);
  if (!z) return res.status(404).json({ message: 'Not found' });
  await z.destroy();
  res.json({ message: 'Deleted' });
}
