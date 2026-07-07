import { body } from 'express-validator';
import { Op } from 'sequelize';
import { Coupon } from '../models/index.js';

export const validateValidators = [body('code').trim().notEmpty()];

export async function validateCoupon(req, res) {
  const code = String(req.body.code).toUpperCase();
  const subtotal = Number(req.body.subtotal) || 0;
  const coupon = await Coupon.findOne({
    where: {
      code,
      is_active: true,
      [Op.or]: [{ expiry: null }, { expiry: { [Op.gt]: new Date() } }],
    },
  });
  if (!coupon) {
    return res.status(400).json({ message: 'Invalid or expired coupon' });
  }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
    return res.status(400).json({ message: 'Coupon usage limit reached' });
  }
  if (Number(coupon.min_order) > subtotal) {
    return res.status(400).json({
      message: `Minimum order ₹${coupon.min_order} required`,
    });
  }
  let discount = 0;
  if (coupon.discount_type === 'percent') {
    discount = Math.round(subtotal * (Number(coupon.discount_value) / 100) * 100) / 100;
  } else {
    discount = Math.min(Number(coupon.discount_value), subtotal);
  }
  res.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
    },
    discount,
  });
}

export async function adminList(req, res) {
  const rows = await Coupon.findAll({ order: [['created_at', 'DESC']] });
  res.json({
    coupons: rows.map((c) => ({
      ...c.get({ plain: true }),
      discount_value: Number(c.discount_value),
      min_order: Number(c.min_order),
    })),
  });
}

export async function adminCreate(req, res) {
  const data = {
    ...req.body,
    code: String(req.body.code).toUpperCase(),
  };
  const c = await Coupon.create(data);
  res.status(201).json({ coupon: c });
}

export async function adminUpdate(req, res) {
  const c = await Coupon.findByPk(req.params.id);
  if (!c) return res.status(404).json({ message: 'Not found' });
  if (req.body.code) req.body.code = String(req.body.code).toUpperCase();
  await c.update(req.body);
  res.json({ coupon: c });
}

export async function adminDelete(req, res) {
  const c = await Coupon.findByPk(req.params.id);
  if (!c) return res.status(404).json({ message: 'Not found' });
  await c.destroy();
  res.json({ message: 'Deleted' });
}
