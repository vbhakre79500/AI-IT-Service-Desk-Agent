import { Pool, PoolConfig } from 'pg';
import { newDb, IMemoryDb } from 'pg-mem';
import fs from 'node:fs';
import path from 'node:path';

// Load schema DDL
function loadSchemaSql(): string {
  try {
    const schemaPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'src/lib/db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      return fs.readFileSync(schemaPath, 'utf-8');
    }
  } catch {
    // Fallback if path resolve varies
  }
  return '';
}

let activePool: Pool | any = null;
let isMemoryMode = false;
let schemaInitialized = false;

/**
 * Determines whether a given database URL is a real, connectable PostgreSQL string
 * vs an empty string or template placeholder.
 */
function isConfiguredPostgresUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('postgres://') && !trimmed.startsWith('postgresql://')) {
    return false;
  }
  // Check for placeholder templates
  if (trimmed.includes('[YOUR-PASSWORD]') || trimmed.includes('[YOUR-PROJECT-REF]') || trimmed.includes('example.com')) {
    return false;
  }
  return true;
}

/**
 * Initializes and returns the active PostgreSQL connection pool.
 * - Uses real pg.Pool with SSL when DATABASE_URL is configured.
 * - Gracefully falls back to an in-memory PostgreSQL engine (pg-mem) for testing and local dev.
 */
export function getPool(): Pool | any {
  if (activePool) {
    return activePool;
  }

  const dbUrl = process.env.DATABASE_URL;

  if (isConfiguredPostgresUrl(dbUrl)) {
    try {
      const isSupabase = dbUrl?.includes('supabase') || dbUrl?.includes('pooler');
      const poolConfig: PoolConfig = {
        connectionString: dbUrl,
        ssl: isSupabase || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      };

      activePool = new Pool(poolConfig);
      isMemoryMode = false;
      return activePool;
    } catch {
      // If pool creation fails, fallback to memory
    }
  }

  // In-memory PostgreSQL instance for offline testing / development
  const memDb: IMemoryDb = newDb();
  activePool = new (memDb.adapters.createPg().Pool)();
  isMemoryMode = true;

  return activePool;
}

/**
 * Ensures the PostgreSQL schema is created and verified on the database.
 */
export async function initPostgresSchema(pool?: any): Promise<void> {
  if (schemaInitialized) return;
  const p = pool || getPool();
  const ddl = loadSchemaSql();
  if (ddl) {
    await p.query(ddl);
  }
  schemaInitialized = true;

  try {
    const userCheck = await p.query('SELECT COUNT(*) as count FROM users');
    const count = parseInt(userCheck.rows[0]?.count || '0', 10);
    if (count === 0) {
      const { seedDatabase } = await import('./seed');
      await seedDatabase(p);
    }
  } catch {
    // Ignore seeding error if tables are being migrated externally
  }
}

/**
 * Executes a parameterized SQL query returning rows and rowCount.
 */
export async function query<T = any>(
  text: string, 
  params: any[] = []
): Promise<{ rows: T[]; rowCount: number }> {
  const p = getPool();
  if (!schemaInitialized) {
    await initPostgresSchema(p);
  }
  const result = await p.query(text, params);
  return {
    rows: (result.rows || []) as T[],
    rowCount: result.rowCount || (result.rows ? result.rows.length : 0),
  };
}

/**
 * Executes a query and returns the first row or null.
 */
export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const res = await query<T>(text, params);
  return res.rows[0] || null;
}

/**
 * Executes a query and returns all rows.
 */
export async function queryRows<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await query<T>(text, params);
  return res.rows;
}

/**
 * Executes an INSERT/UPDATE/DELETE query and returns the affected row count.
 */
export async function execute(text: string, params: any[] = []): Promise<number> {
  const res = await query(text, params);
  return res.rowCount;
}

/**
 * Diagnostic database connectivity check.
 * NEVER prints or exposes the DATABASE_URL.
 */
export async function checkDatabaseConnectivity(): Promise<{
  connected: boolean;
  provider: 'supabase_postgres' | 'local_postgres' | 'in_memory_postgres';
  database: string;
  latencyMs: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    const result = await query('SELECT 1 as ping');
    const isLive = result.rows && result.rows.length > 0;
    const latencyMs = Math.max(0, Date.now() - startTime);

    let provider: 'supabase_postgres' | 'local_postgres' | 'in_memory_postgres' = 'in_memory_postgres';
    let dbName = 'in-memory (pg-mem)';
    if (!isMemoryMode) {
      provider = process.env.DATABASE_URL?.includes('supabase') ? 'supabase_postgres' : 'local_postgres';
      dbName = process.env.DATABASE_URL?.includes('supabase') ? 'Supabase PostgreSQL' : 'PostgreSQL';
    }

    return {
      connected: isLive,
      provider,
      database: dbName,
      latencyMs,
    };
  } catch (err: any) {
    return {
      connected: false,
      provider: isMemoryMode ? 'in_memory_postgres' : 'supabase_postgres',
      database: 'Unknown',
      latencyMs: Math.max(0, Date.now() - startTime),
      error: err.message || 'Database connection probe failed',
    };
  }
}

/**
 * Closes the active database connection pool (useful during clean process exit).
 */
export async function closeDatabase(): Promise<void> {
  if (activePool && typeof activePool.end === 'function') {
    await activePool.end();
    activePool = null;
    schemaInitialized = false;
  }
}

// Backward compatibility alias for legacy imports
export function getDatabase() {
  return {
    query,
    queryOne,
    queryRows,
    execute,
    getPool,
  };
}
