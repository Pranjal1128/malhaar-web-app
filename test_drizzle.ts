import "dotenv/config";
import { db } from "./src/db/index.js";
import { sql } from "drizzle-orm";

async function test() {
  try {
    const res = await db.execute(sql`SELECT 1 as test`);
    console.log("Success! Database connection established via Drizzle ORM.", res.rows);
    process.exit(0);
  } catch (err: any) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }
}

test();
