import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Wishlist = sequelize.define(
  'Wishlist',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  { tableName: 'wishlists' }
);

export default Wishlist;
