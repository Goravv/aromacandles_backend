import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ProductCategory = sequelize.define(
  'ProductCategory',
  {
    product_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
    category_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  },
  { tableName: 'product_categories', timestamps: false }
);

export default ProductCategory;
