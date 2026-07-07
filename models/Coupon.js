import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Coupon = sequelize.define(
  'Coupon',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    discount_type: { type: DataTypes.ENUM('percent', 'fixed'), allowNull: false },
    discount_value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    min_order: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    expiry: DataTypes.DATE,
    usage_limit: DataTypes.INTEGER.UNSIGNED,
    used_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'coupons' }
);

export default Coupon;
