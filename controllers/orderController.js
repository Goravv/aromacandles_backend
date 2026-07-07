import crypto from 'crypto';
import { body } from 'express-validator';
import { Op } from 'sequelize';
import {
  CartItem,
  Product,
  Order,
  OrderItem,
  Address,
  Coupon,
} from '../models/index.js';
import { getRazorpay } from '../utils/razorpayClient.js';
import { getGstRatePercent, calculateGst } from '../utils/tax.js';
import { calculateShippingForPincode } from '../utils/shipping.js';
import { sendMail, orderConfirmationHtml } from '../utils/email.js';

function computeDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (coupon.discount_type === 'percent') {
    return Math.round(subtotal * (Number(coupon.discount_value) / 100) * 100) / 100;
  }
  return Math.min(Number(coupon.discount_value), subtotal);
}

export const checkoutValidators = [
  body('addressId').isInt(),
  body('couponCode').optional().trim(),
];

export async function checkout(req, res) {
  const addressId = Number(req.body.addressId);
  const couponCode = req.body.couponCode
    ? String(req.body.couponCode).toUpperCase()
    : null;

  const address = await Address.findOne({
    where: { id: addressId, user_id: req.user.id },
  });
  if (!address) {
    return res.status(400).json({ message: 'Invalid address' });
  }

  const cartItems = await CartItem.findAll({
    where: { user_id: req.user.id },
    include: [Product],
  });
  if (!cartItems.length) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  let subtotal = 0;
  let totalWeight = 0;
  const lines = [];
  for (const row of cartItems) {
    const p = row.Product;
    if (!p || !p.is_active) continue;
    if (p.stock < row.quantity) {
      return res.status(400).json({
        message: `Insufficient stock for ${p.name}`,
      });
    }
    const lineTotal = Number(p.price) * row.quantity;
    subtotal += lineTotal;
    totalWeight += Number(p.weight_kg || 0.2) * row.quantity;
    lines.push({ product: p, quantity: row.quantity, price: Number(p.price) });
  }
  if (!lines.length) {
    return res.status(400).json({ message: 'No valid items in cart' });
  }

  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({
      where: {
        code: couponCode,
        is_active: true,
        [Op.or]: [{ expiry: null }, { expiry: { [Op.gt]: new Date() } }],
      },
    });
    if (!coupon) {
      return res.status(400).json({ message: 'Invalid coupon' });
    }
    if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }
    if (Number(coupon.min_order) > subtotal) {
      return res.status(400).json({
        message: `Minimum order ₹${coupon.min_order} for this coupon`,
      });
    }
  }

  const discount = computeDiscount(coupon, subtotal);
  const afterDiscount = Math.max(0, subtotal - discount);
  const ship = await calculateShippingForPincode(address.pincode, totalWeight);
  const shippingCost = ship.cost;
  const taxable = afterDiscount + shippingCost;
  const gstRate = await getGstRatePercent();
  const gst = calculateGst(taxable, gstRate);
  const total = Math.round((taxable + gst) * 100) / 100;

  const order = await Order.create({
    user_id: req.user.id,
    address_id: address.id,
    coupon_id: coupon ? coupon.id : null,
    subtotal,
    discount,
    shipping_cost: shippingCost,
    gst,
    total,
    shipping_weight_kg: totalWeight,
    status: 'pending',
    payment_status: 'pending',
  });

  for (const line of lines) {
    await OrderItem.create({
      order_id: order.id,
      product_id: line.product.id,
      quantity: line.quantity,
      price: line.price,
    });
  }

  const rz = getRazorpay();
  if (!rz) {
    return res.status(503).json({
      message: 'Payment gateway not configured',
      orderId: order.id,
    });
  }

  const amountPaise = Math.round(total * 100);
  const rpOrder = await rz.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `order_${order.id}`,
    notes: { order_id: String(order.id) },
  });

  await order.update({ razorpay_order_id: rpOrder.id });

  return res.json({
    orderId: order.id,
    razorpayOrderId: rpOrder.id,
    amount: total,
    amountPaise,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
    shipping: { cost: shippingCost, message: ship.message },
    breakdown: { subtotal, discount, shipping: shippingCost, gst, total },
  });
}

export const verifyValidators = [
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
];

export async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return res.status(503).json({ message: 'Payment not configured' });
  }
  const bodyStr = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
  if (expected !== razorpay_signature) {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }

  const order = await Order.findOne({
    where: { razorpay_order_id, user_id: req.user.id },
    include: [Address, OrderItem],
  });
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  if (order.payment_status === 'paid') {
    return res.json({ message: 'Already paid', orderId: order.id });
  }

  await order.update({
    payment_status: 'paid',
    status: 'paid',
    razorpay_payment_id,
  });

  const items = await OrderItem.findAll({
    where: { order_id: order.id },
    include: [Product],
  });
  for (const line of items) {
    const p = line.Product;
    if (p) {
      await p.update({ stock: Math.max(0, p.stock - line.quantity) });
    }
  }

  if (order.coupon_id) {
    const c = await Coupon.findByPk(order.coupon_id);
    if (c) await c.increment('used_count');
  }

  await CartItem.destroy({ where: { user_id: req.user.id } });

  const addr = order.Address;
  await sendMail({
    to: req.user.email,
    subject: `Order confirmed #${order.id} — Aromacandle`,
    html: orderConfirmationHtml(order, items, addr),
    text: `Your order #${order.id} total ₹${order.total} is confirmed.`,
  });

  return res.json({ message: 'Payment successful', orderId: order.id });
}

export async function myOrders(req, res) {
  const orders = await Order.findAll({
    where: { user_id: req.user.id },
    order: [['created_at', 'DESC']],
    include: [
      {
        model: OrderItem,
        include: [{ model: Product, attributes: ['id', 'name', 'slug', 'images'] }],
      },
    ],
  });
  res.json({
    orders: orders.map((o) => ({
      id: o.id,
      total: Number(o.total),
      status: o.status,
      payment_status: o.payment_status,
      created_at: o.created_at,
      items: o.OrderItems?.map((i) => ({
        quantity: i.quantity,
        price: Number(i.price),
        product: i.Product,
      })),
    })),
  });
}

export async function getOrder(req, res) {
  const order = await Order.findOne({
    where: { id: req.params.id, user_id: req.user.id },
    include: [
      Address,
      {
        model: OrderItem,
        include: [Product],
      },
    ],
  });
  if (!order) return res.status(404).json({ message: 'Not found' });
  res.json({
    order: {
      id: order.id,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shipping_cost: Number(order.shipping_cost),
      gst: Number(order.gst),
      total: Number(order.total),
      status: order.status,
      payment_status: order.payment_status,
      razorpay_order_id: order.razorpay_order_id,
      created_at: order.created_at,
      address: order.Address,
      items: order.OrderItems?.map((i) => ({
        quantity: i.quantity,
        price: Number(i.price),
        customization_note: i.customization_note,
        product: i.Product
          ? {
              name: i.Product.name,
              slug: i.Product.slug,
              images: i.Product.images,
            }
          : null,
      })),
    },
  });
}

export async function paymentFailed(req, res) {
  const { orderId } = req.body;
  const order = await Order.findOne({
    where: { id: orderId, user_id: req.user.id },
  });
  if (!order) return res.status(404).json({ message: 'Not found' });
  if (order.payment_status === 'pending') {
    await order.update({ payment_status: 'failed', status: 'failed' });
  }
  res.json({ message: 'Recorded. You can retry checkout.' });
}
