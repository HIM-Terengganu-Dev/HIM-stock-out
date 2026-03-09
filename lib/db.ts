import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString = process.env.CURSORMADE_HIM_DB_V2 || process.env.CURSORMADE_HIM_DB;
    if (!connectionString) {
      throw new Error('CURSORMADE_HIM_DB_V2 environment variable is not set');
    }
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}
