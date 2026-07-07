import { body } from 'express-validator';
import { Address } from '../models/index.js';

export const addressValidators = [
  body('name').trim().isLength({ min: 2, max: 120 }),
  body('street').trim().isLength({ min: 3, max: 255 }),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('pincode').matches(/^[0-9]{6}$/),
  body('phone').optional().isLength({ min: 10, max: 15 }),
];

export async function list(req, res) {
  const rows = await Address.findAll({
    where: { user_id: req.user.id },
    order: [['is_default', 'DESC'], ['created_at', 'DESC']],
  });
  res.json({ addresses: rows });
}

export async function create(req, res) {
  const data = { ...req.body, user_id: req.user.id };
  if (req.body.is_default) {
    await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
  }
  const addr = await Address.create(data);
  res.status(201).json({ address: addr });
}

export async function update(req, res) {
  const addr = await Address.findOne({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (!addr) return res.status(404).json({ message: 'Not found' });
  if (req.body.is_default) {
    await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
  }
  await addr.update(req.body);
  res.json({ address: addr });
}

export async function remove(req, res) {
  const n = await Address.destroy({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (!n) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
}
