import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
    phone: DataTypes.STRING(20),
    email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    otp_hash: DataTypes.STRING(255),
    otp_expires_at: DataTypes.DATE,
    refresh_token_hash: DataTypes.STRING(255),
  },
  { tableName: 'users' }
);

export default User;
