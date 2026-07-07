import { body } from 'express-validator';
import { CustomOrder } from '../models/index.js';

export const createValidators = [
  body('name').trim().isLength({ min: 2, max: 120 }),
  body('product_type').trim().notEmpty(),
  body('scent').optional().trim(),
  body('size').optional().trim(),
  body('message').optional().trim(),
  body('delivery_date').optional().isISO8601(),
];

export async function create(req, res) {
  const data = {
    ...req.body,
    user_id: req.user ? req.user.id : null,
  };
  const row = await CustomOrder.create(data);
  res.status(201).json({ customOrder: row });
}

export async function adminList(req, res) {
  const rows = await CustomOrder.findAll({
    order: [['created_at', 'DESC']],
    limit: 200,
  });
  res.json({ orders: rows });
}

export async function adminUpdateStatus(req, res) {
  const row = await CustomOrder.findByPk(req.params.id);
  if (!row) return res.status(404).json({ message: 'Not found' });
  await row.update({ status: req.body.status });
  res.json({ customOrder: row });
}
