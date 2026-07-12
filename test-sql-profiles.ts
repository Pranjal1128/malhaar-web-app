import { db } from "./src/db/index.ts";
import { malhaarData } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const rows = await db.select().from(malhaarData).where(eq(malhaarData.key, "profiles"));
    if (rows.length > 0) {
      console.log("SQL Database has profiles key!");
      const value = rows[0].value;
      if (Array.isArray(value)) {
        console.log("Profiles count in SQL:", value.length);
        console.log("Names in SQL:", value.map((p: any) => p.name));
      } else {
        console.log("Profiles value in SQL is not an array:", typeof value);
      }
    } else {
      console.log("No profiles key found in SQL database.");
    }
  } catch (err: any) {
    console.error("SQL Error:", err.message);
  }
}

run();
