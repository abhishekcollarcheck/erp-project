import { Sequelize } from 'sequelize';
import { env } from './env';
import { logger } from './logger';

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  timezone: '+05:30', // IST
  logging: false,
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
});

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    if (env.nodeEnv === 'development') {
      await sequelize.sync({alter: true, logging: console.log});
    }

  }catch (error: any) {
  console.error("========== DATABASE ERROR ==========");
  console.error(error);
  console.error("Message:", error?.message);
  console.error("Name:", error?.name);
  console.error("Code:", error?.code);
  console.error("Errno:", error?.errno);
  console.error("SQL State:", error?.sqlState);
  console.error("Stack:", error?.stack);
  console.error("Original:", error?.original);
  console.error("====================================");
  process.exit(1);
}
}