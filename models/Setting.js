import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Setting = sequelize.define(
  'Setting',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    value: DataTypes.TEXT,
  },
  { tableName: 'settings' }
);

export default Setting;
