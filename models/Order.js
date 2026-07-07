import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Order = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    address_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    coupon_id: DataTypes.INTEGER.UNSIGNED,
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    discount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    shipping_cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    gst: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    shipping_weight_kg: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'),
      defaultValue: 'pending',
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      defaultValue: 'pending',
    },
    razorpay_order_id: DataTypes.STRING(120),
    razorpay_payment_id: DataTypes.STRING(120),
  },
  { tableName: 'orders' }
);

export default Order;
