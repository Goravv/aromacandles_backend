import { Wishlist, Product } from '../models/index.js';

export async function list(req, res) {
  const rows = await Wishlist.findAll({
    where: { user_id: req.user.id },
    include: [{ model: Product, where: { is_active: true }, required: true }],
    order: [['created_at', 'DESC']],
  });
  res.json({
    items: rows.map((w) => ({
      id: w.id,
      product: {
        id: w.Product.id,
        name: w.Product.name,
        slug: w.Product.slug,
        price: Number(w.Product.price),
        images: w.Product.images || [],
      },
    })),
  });
}

export async function add(req, res) {
  const product = await Product.findByPk(req.params.productId);
  if (!product || !product.is_active) {
    return res.status(404).json({ message: 'Product not found' });
  }
  await Wishlist.findOrCreate({
    where: { user_id: req.user.id, product_id: product.id },
    defaults: {},
  });
  res.json({ message: 'Saved' });
}

export async function remove(req, res) {
  const n = await Wishlist.destroy({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (!n) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Removed' });
}

export async function removeByProduct(req, res) {
  await Wishlist.destroy({
    where: { user_id: req.user.id, product_id: req.params.productId },
  });
  res.json({ message: 'Removed' });
}
