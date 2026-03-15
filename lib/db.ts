import { Pool, PoolConfig } from 'pg';

// Ensure this is only used on the server side
if (typeof window !== 'undefined') {
  throw new Error('lib/db.ts can only be used on the server side');
}

// Database connection pool singleton
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const config = getPoolConfig();
    pool = new Pool(config);
    console.log('[DB] Created database connection pool');
  }
  return pool;
}

export function getPoolConfig(): PoolConfig {
  // Build DATABASE_URL from individual environment variables if not provided
  const databaseUrl = process.env.DATABASE_URL ||
    `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:5432/${process.env.POSTGRES_DB}`;

  return {
    connectionString: databaseUrl,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds of connection attempt
  };
}

export async function queryDatabase<T>(text: string, params: any[] = []): Promise<T[]> {
  const dbPool = getPool();
  
  try {
    const result = await dbPool.query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error('[DB] Query error:', error);
    throw error;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] Database connection pool closed');
  }
}
