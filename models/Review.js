import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Review = sequelize.define(
  'Review',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    comment: DataTypes.TEXT,
  },
  { tableName: 'reviews' }
);

export default Review;
