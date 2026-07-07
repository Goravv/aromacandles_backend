import { body } from 'express-validator';
import { CartItem, Product } from '../models/index.js';

export const addValidators = [
  body('productId').isInt(),
  body('quantity').optional().isInt({ min: 1 }),
];

export async function getCart(req, res) {
  const items = await CartItem.findAll({
    where: { user_id: req.user.id },
    include: [{ model: Product, where: { is_active: true }, required: false }],
  });
  const rows = items
    .filter((i) => i.Product)
    .map((i) => ({
      id: i.id,
      quantity: i.quantity,
      product: formatProduct(i.Product),
    }));
  res.json({ items: rows });
}

export async function addItem(req, res) {
  const productId = Number(req.body.productId);
  const quantity = Number(req.body.quantity) || 1;
  const product = await Product.findByPk(productId);
  if (!product || !product.is_active) {
    return res.status(404).json({ message: 'Product not available' });
  }
  if (product.stock < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }
  const [item, created] = await CartItem.findOrCreate({
    where: { user_id: req.user.id, product_id: productId },
    defaults: { quantity },
  });
  if (!created) {
    const nextQty = item.quantity + quantity;
    if (product.stock < nextQty) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    await item.update({ quantity: nextQty });
  }
  res.json({ message: 'Added to cart' });
}

export async function updateItem(req, res) {
  const item = await CartItem.findOne({
    where: { id: req.params.id, user_id: req.user.id },
    include: [Product],
  });
  if (!item) return res.status(404).json({ message: 'Not found' });
  const qty = Number(req.body.quantity);
  if (qty < 1) {
    await item.destroy();
    return res.json({ message: 'Removed' });
  }
  if (item.Product && qty > item.Product.stock) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }
  await item.update({ quantity: qty });
  res.json({ message: 'Updated' });
}

export async function removeItem(req, res) {
  const n = await CartItem.destroy({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (!n) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Removed' });
}

export async function clearCart(req, res) {
  await CartItem.destroy({ where: { user_id: req.user.id } });
  res.json({ message: 'Cart cleared' });
}

function formatProduct(p) {
  const plain = p.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    price: Number(plain.price),
    images: Array.isArray(plain.images) ? plain.images : [],
    stock: plain.stock,
    weight_kg: plain.weight_kg != null ? Number(plain.weight_kg) : 0.2,
  };
}
