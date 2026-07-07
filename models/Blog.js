import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Blog = sequelize.define(
  'Blog',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(220), allowNull: false },
    slug: { type: DataTypes.STRING(240), allowNull: false, unique: true },
    content: { type: DataTypes.TEXT('long'), allowNull: false },
    image: DataTypes.STRING(500),
    author: DataTypes.STRING(120),
    is_published: { type: DataTypes.BOOLEAN, defaultValue: false },
    published_at: DataTypes.DATE,
  },
  { tableName: 'blogs' }
);

export default Blog;
