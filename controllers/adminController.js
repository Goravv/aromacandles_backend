import { Op, fn, col } from 'sequelize';
import {
  User,
  Order,
  Product,
  OrderItem,
  Address,
  Setting,
} from '../models/index.js';

export async function dashboard(req, res) {
  const totalUsers = await User.count({ where: { role: 'user' } });
  const totalOrders = await Order.count();
  const revenueRow = await Order.findOne({
    where: { payment_status: 'paid' },
    attributes: [[fn('SUM', col('total')), 'sum']],
    raw: true,
  });
  const revenue = Number(revenueRow?.sum || 0);

  const last30 = await Order.findAll({
    where: {
      payment_status: 'paid',
      created_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    attributes: [
      [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
      [fn('SUM', col('total')), 'total'],
    ],
    group: [fn('DATE_FORMAT', col('created_at'), '%Y-%m')],
    raw: true,
  });

  const lowStock = await Product.findAll({
    where: { stock: { [Op.lt]: 10 }, is_active: true },
    order: [['stock', 'ASC']],
    limit: 20,
  });

  res.json({
    totalUsers,
    totalOrders,
    revenue,
    salesByMonth: last30.map((r) => ({
      month: r.month,
      total: Number(r.total || 0),
    })),
    lowStock: lowStock.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      slug: p.slug,
    })),
  });
}

export async function listOrders(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const offset = (page - 1) * limit;
  const { rows, count } = await Order.findAndCountAll({
    include: [
      { model: User, attributes: ['id', 'name', 'email'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
  res.json({
    orders: rows.map((o) => ({
      id: o.id,
      total: Number(o.total),
      status: o.status,
      payment_status: o.payment_status,
      user: o.User,
      created_at: o.created_at,
      razorpay_order_id: o.razorpay_order_id,
    })),
    total: count,
    page,
  });
}

export async function updateOrderStatus(req, res) {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ message: 'Not found' });
  await order.update({ status: req.body.status });
  res.json({ order });
}

export async function invoice(req, res) {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: User, attributes: ['name', 'email'] },
      { model: Address },
      { model: OrderItem, include: [{ model: Product }] },
    ],
  });
  if (!order) return res.status(404).json({ message: 'Not found' });
  res.json({
    invoice: {
      orderId: order.id,
      date: order.created_at,
      customer: order.User,
      address: order.Address,
      items: order.OrderItems?.map((i) => ({
        name: i.Product?.name,
        quantity: i.quantity,
        unitPrice: Number(i.price),
        lineTotal: Number(i.price) * i.quantity,
      })),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shipping: Number(order.shipping_cost),
      gst: Number(order.gst),
      total: Number(order.total),
    },
  });
}

export async function listCustomers(req, res) {
  const rows = await User.findAll({
    where: { role: 'user' },
    attributes: { exclude: ['password', 'otp_hash', 'refresh_token_hash'] },
    order: [['created_at', 'DESC']],
    limit: 200,
  });
  res.json({ customers: rows });
}

export async function getSettings(req, res) {
  const gst = await Setting.findOne({ where: { key: 'gst_rate_percent' } });
  res.json({
    gst_rate_percent: gst?.value != null ? Number(gst.value) : 18,
  });
}

export async function updateSettings(req, res) {
  if (req.body.gst_rate_percent != null) {
    const v = String(req.body.gst_rate_percent);
    await Setting.upsert({ key: 'gst_rate_percent', value: v });
  }
  res.json({ message: 'Saved' });
}
