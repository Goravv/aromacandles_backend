import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CartItem = sequelize.define(
  'CartItem',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 1 },
  },
  { tableName: 'cart_items' }
);

export default CartItem;
