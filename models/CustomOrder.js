import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CustomOrder = sequelize.define(
  'CustomOrder',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: DataTypes.INTEGER.UNSIGNED,
    name: { type: DataTypes.STRING(120), allowNull: false },
    product_type: { type: DataTypes.STRING(80), allowNull: false },
    scent: DataTypes.STRING(120),
    size: DataTypes.STRING(40),
    message: DataTypes.TEXT,
    delivery_date: DataTypes.DATEONLY,
    status: {
      type: DataTypes.ENUM('new', 'quoted', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'new',
    },
  },
  { tableName: 'custom_orders' }
);

export default CustomOrder;
