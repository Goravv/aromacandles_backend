import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Address = sequelize.define(
  'Address',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    street: { type: DataTypes.STRING(255), allowNull: false },
    city: { type: DataTypes.STRING(100), allowNull: false },
    state: { type: DataTypes.STRING(100), allowNull: false },
    pincode: { type: DataTypes.STRING(10), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'addresses' }
);

export default Address;
