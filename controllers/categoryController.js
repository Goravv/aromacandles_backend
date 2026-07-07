import slugify from 'slugify';
import { Category } from '../models/index.js';

export async function listAll(req, res) {
  const { type } = req.query;
  const where = {};
  if (type) where.type = type;
  const rows = await Category.findAll({
    where,
    order: [['name', 'ASC']],
  });
  res.json({ categories: rows });
}

export async function adminCreate(req, res) {
  const { name, type, parent_id } = req.body;
  const slug =
    req.body.slug ||
    slugify(String(name), { lower: true, strict: true });
  const cat = await Category.create({ name, slug, type, parent_id: parent_id || null });
  res.status(201).json({ category: cat });
}

export async function adminUpdate(req, res) {
  const c = await Category.findByPk(req.params.id);
  if (!c) return res.status(404).json({ message: 'Not found' });
  await c.update(req.body);
  res.json({ category: c });
}

export async function adminDelete(req, res) {
  const c = await Category.findByPk(req.params.id);
  if (!c) return res.status(404).json({ message: 'Not found' });
  await c.destroy();
  res.json({ message: 'Deleted' });
}
