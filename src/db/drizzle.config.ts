import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file.
dotenv.config();

let SUPABASE_HOST = process.env.SUPABASE_HOST || 'db.irolbvsqyshihomfzflk.supabase.co';
if (!SUPABASE_HOST || !SUPABASE_HOST.includes('.') || SUPABASE_HOST === 'Malhaar') {
  SUPABASE_HOST = 'db.irolbvsqyshihomfzflk.supabase.co';
}
const SUPABASE_USER = process.env.SUPABASE_USER || 'postgres';
const SUPABASE_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const SUPABASE_DB_NAME = process.env.SUPABASE_DB_NAME || 'postgres';
const SUPABASE_PORT = process.env.SUPABASE_PORT ? parseInt(process.env.SUPABASE_PORT, 10) : 6543;

const useSupabase = !!SUPABASE_PASSWORD;

const host = useSupabase ? SUPABASE_HOST : process.env.SQL_HOST;
const database = useSupabase ? SUPABASE_DB_NAME : process.env.SQL_DB_NAME;
const user = useSupabase ? SUPABASE_USER : process.env.SQL_ADMIN_USER;
const password = useSupabase ? SUPABASE_PASSWORD : process.env.SQL_ADMIN_PASSWORD;
const port = useSupabase ? SUPABASE_PORT : 5432;

if (!host) {
  throw new Error("Database host must be set.");
}
if (!database) {
  throw new Error("Database name must be set.");
}
if (!user) {
  throw new Error("Database user must be set.");
}
if (!password) {
  throw new Error("Database password must be set.");
}

console.log(`Connecting Drizzle Kit to ${useSupabase ? 'Supabase' : 'Cloud SQL'} host: ${host}, user: ${user}, database: ${database}`);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: host,
    port: port,
    user: user,
    password: password,
    database: database,
    ssl: useSupabase ? { rejectUnauthorized: false } : false,
  },
  verbose: true,
});
