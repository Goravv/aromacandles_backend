import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ShippingZone = sequelize.define(
  'ShippingZone',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    zone_name: { type: DataTypes.STRING(120), allowNull: false },
    pincodes: { type: DataTypes.TEXT, allowNull: false },
    base_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    per_kg_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  { tableName: 'shipping_zones' }
);

export default ShippingZone;
