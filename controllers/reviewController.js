import { body } from 'express-validator';
import { Op } from 'sequelize';
import { Review, Order, OrderItem, Product } from '../models/index.js';

export const createValidators = [
  body('productId').isInt(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ max: 2000 }),
];

async function isVerifiedBuyer(userId, productId) {
  const order = await Order.findOne({
    where: {
      user_id: userId,
      payment_status: 'paid',
      status: { [Op.in]: ['paid', 'processing', 'shipped', 'delivered'] },
    },
    include: [
      {
        model: OrderItem,
        where: { product_id: productId },
        required: true,
      },
    ],
  });
  return Boolean(order);
}

export async function create(req, res) {
  const productId = Number(req.body.productId);
  const product = await Product.findByPk(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const ok = await isVerifiedBuyer(req.user.id, productId);
  if (!ok) {
    return res.status(403).json({ message: 'Only verified buyers can review this product.' });
  }
  const existing = await Review.findOne({
    where: { user_id: req.user.id, product_id: productId },
  });
  if (existing) {
    return res.status(409).json({ message: 'You already reviewed this product.' });
  }
  const review = await Review.create({
    product_id: productId,
    user_id: req.user.id,
    rating: Number(req.body.rating),
    comment: req.body.comment || null,
  });
  res.status(201).json({ review });
}

export async function adminDelete(req, res) {
  const r = await Review.findByPk(req.params.id);
  if (!r) return res.status(404).json({ message: 'Not found' });
  await r.destroy();
  res.json({ message: 'Deleted' });
}
