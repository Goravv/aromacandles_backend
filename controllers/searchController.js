import { Op } from 'sequelize';
import { Product } from '../models/index.js';

export async function suggest(req, res) {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) {
    return res.json({ suggestions: [] });
  }
  const like = `%${q}%`;
  const rows = await Product.findAll({
    where: {
      is_active: true,
      [Op.or]: [{ name: { [Op.like]: like } }, { slug: { [Op.like]: like } }],
    },
    attributes: ['id', 'name', 'slug', 'price', 'images'],
    limit: 10,
    order: [['name', 'ASC']],
  });
  res.json({
    suggestions: rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      image: Array.isArray(p.images) && p.images[0] ? p.images[0] : null,
    })),
  });
}
