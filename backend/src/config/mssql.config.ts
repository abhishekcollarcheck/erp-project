/**
 * mssql.config.ts
 *
 * Connection to the local MSSQL Realtime attendance database.
 * This is a separate DB from the main MySQL NexHR database.
 *
 * Place this file at: backend/src/config/mssql.config.ts
 *
 * Install mssql first:
 *   npm install mssql
 *   npm install --save-dev @types/mssql
 */

import sql from 'mssql';

const config: sql.config = {
  user:     'sa',
  password: 'abc@123',
  server:   '61.247.238.154',
  database: 'Realtime',
  port:     1433,
  options: {
    encrypt:                false,
    trustServerCertificate: true,
    enableArithAbort:       true,
    instanceName:           undefined,   // agar named instance hai jaise SQLEXPRESS to yahan likhna
  },
  connectionTimeout: 30000,   // 30 seconds
  requestTimeout:    30000,
  pool: {
    max:               10,
    min:               0,
    idleTimeoutMillis: 30000,
  },
};

// Singleton pool — shared across all requests
let pool: sql.ConnectionPool | null = null;

export async function getMSSQLPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool;

  pool = new sql.ConnectionPool(config);

  pool.on('error', (err) => {
    console.error('[MSSQL] Pool error:', err);
    pool = null;
  });

  await pool.connect();
  console.log('✅ [MSSQL] Connected to Realtime DB at 192.168.1.197');
  return pool;
}

export async function queryMSSQL<T = any>(
  sqlText: string,
  params?: Record<string, { value: any; type?: sql.ISqlType }>,
): Promise<T[]> {
  const p       = await getMSSQLPool();
  const request = p.request();

  if (params) {
    for (const [name, { value, type }] of Object.entries(params)) {
      if (type) request.input(name, type, value);
      else      request.input(name, value);
    }
  }

  const result = await request.query(sqlText);
  return result.recordset as T[];
}

export { sql };