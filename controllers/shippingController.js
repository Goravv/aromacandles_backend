import { body } from 'express-validator';
import { calculateShippingForPincode } from '../utils/shipping.js';

export const quoteValidators = [
  body('pincode').matches(/^[0-9]{6}$/),
  body('weightKg').optional().isFloat({ min: 0 }),
];

export async function quote(req, res) {
  const pincode = req.body.pincode;
  const weightKg = Number(req.body.weightKg) || 0.5;
  const result = await calculateShippingForPincode(pincode, weightKg);
  res.json({
    pincode,
    weightKg,
    cost: result.cost,
    zone: result.zone
      ? { id: result.zone.id, name: result.zone.zone_name }
      : null,
    message: result.message,
  });
}
