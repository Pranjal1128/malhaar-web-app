import { db } from "./src/db/index.ts";
import { malhaarData } from "./src/db/schema.ts";

async function run() {
  try {
    const rows = await db.select().from(malhaarData);
    console.log(`Drizzle has ${rows.length} rows.`);
    rows.forEach((row) => {
      console.log(`--- Key: ${row.key} ---`);
      console.log(JSON.stringify(row.value, null, 2));
    });
  } catch (err: any) {
    console.error("Error:", err);
  }
}

run();
