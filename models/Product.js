import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
    description: DataTypes.TEXT,
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    stock: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    weight_kg: { type: DataTypes.DECIMAL(8, 3), defaultValue: 0.2 },
    category_id: DataTypes.INTEGER.UNSIGNED,
    type: {
      type: DataTypes.ENUM(
        'scented_jar',
        'pillar',
        'wax_melt',
        'soy',
        'tea_light',
        'wax_sachet'
      ),
      allowNull: false,
    },
    images: DataTypes.JSON,
    is_customizable: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'products' }
);

export default Product;
