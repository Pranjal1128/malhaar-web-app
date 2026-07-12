import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pkg;

// Function to create a new connection pool.
export const createPool = () => {
  if (process.env.DATABASE_URL) {
    console.log("Connecting database pool using DATABASE_URL...");
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 10000,
      keepAlive: true,
      connectionTimeoutMillis: 5000,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  let SUPABASE_HOST = process.env.SUPABASE_HOST || 'db.irolbvsqyshihomfzflk.supabase.co';
  if (!SUPABASE_HOST || !SUPABASE_HOST.includes('.') || SUPABASE_HOST === 'Malhaar') {
    SUPABASE_HOST = 'db.irolbvsqyshihomfzflk.supabase.co';
  }
  const SUPABASE_USER = process.env.SUPABASE_USER || 'postgres';
  // Use the provided SUPABASE_DB_PASSWORD. If not set, we default to empty (disabling Supabase TCP connection).
  let SUPABASE_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_PASSWORD && SUPABASE_SERVICE_ROLE_KEY) {
    const isJwt = SUPABASE_SERVICE_ROLE_KEY.split('.').length === 3 && SUPABASE_SERVICE_ROLE_KEY.split('.')[0].startsWith('eyJ');
    const isSbToken = SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_');
    if (!isJwt && !isSbToken) {
      SUPABASE_PASSWORD = SUPABASE_SERVICE_ROLE_KEY;
    }
  }
  const SUPABASE_DB_NAME = process.env.SUPABASE_DB_NAME || 'postgres';
  // Default to 6543 because direct connection on port 5432 is blocked/ECONNREFUSED in sandbox container environments.
  const SUPABASE_PORT = process.env.SUPABASE_PORT ? parseInt(process.env.SUPABASE_PORT, 10) : 6543;

  const useSupabase = !!SUPABASE_PASSWORD;

  if (useSupabase) {
    console.log("Connecting database pool to Supabase pooled host:", `${SUPABASE_HOST}:${SUPABASE_PORT}`);
    return new Pool({
      host: SUPABASE_HOST,
      user: SUPABASE_USER,
      password: SUPABASE_PASSWORD,
      database: SUPABASE_DB_NAME,
      port: SUPABASE_PORT,
      max: 10,
      idleTimeoutMillis: 10000,
      keepAlive: true,
      connectionTimeoutMillis: 5000,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  console.log("No SUPABASE_DB_PASSWORD provided in environment. Connecting to local Cloud SQL database instead (where tables are fully created and working).");
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    max: 10,
    idleTimeoutMillis: 10000,
    keepAlive: true,
    connectionTimeoutMillis: 3000,
  });
};

// Create a pool instance.
const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on('error', (err: any) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
