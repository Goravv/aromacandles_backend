import dotenv from 'dotenv';
import path from 'path';
import mysql from 'mysql2';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'mysql',
    dialectModule: mysql,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);

// ✅ Test connection
try {
  await sequelize.authenticate();
  console.log("✅ Database connected successfully");
} catch (error) {
  console.error("❌ Unable to connect:", error);
}

export default sequelize;




// const sequelize = new Sequelize(
//   process.env.DB_NAME || 'aromacandle',
//   process.env.DB_USER || 'root',
//   process.env.DB_PASSWORD || '',
//   {
//     host: process.env.DB_HOST || '127.0.0.1',
//     port: Number(process.env.DB_PORT) || 3306,
//     dialect: 'mysql',
//     logging: process.env.NODE_ENV === 'development' ? console.log : false,
//     define: {
//       underscored: true,
//       timestamps: true,
//       createdAt: 'created_at',
//       updatedAt: 'updated_at',
//     },
//     pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
//   }
// );

// export default sequelize;
