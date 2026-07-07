import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Category = sequelize.define(
  'Category',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    type: { type: DataTypes.ENUM('scent', 'occasion', 'size', 'collection'), allowNull: false },
    parent_id: DataTypes.INTEGER.UNSIGNED,
  },
  { tableName: 'categories' }
);

export default Category;
