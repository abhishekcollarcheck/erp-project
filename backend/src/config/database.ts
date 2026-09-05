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
      // alter MUST stay false. `sync({ alter: true })` on inline `unique: true`
      // attributes is what caused the "Too many keys specified; max 64 keys
      // allowed" outage on the master-data tables (see the 2026-09-05
      // unique-index cleanup migration) — every boot added another anonymous
      // unique index Sequelize couldn't match to the one it made last time.
      // Schema changes belong in migrations (`npm run migrate`); this only
      // creates tables that don't exist yet.
      await sequelize.sync({ alter: false });
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