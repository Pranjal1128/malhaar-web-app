import { db } from "./src/db/index.ts";
import { malhaarData } from "./src/db/schema.ts";

async function run() {
  try {
    const rows = await db.select().from(malhaarData);
    console.log(`Drizzle has ${rows.length} rows.`);
    rows.forEach((row) => {
      let len = 0;
      if (Array.isArray(row.value)) len = row.value.length;
      else if (row.value && typeof row.value === 'object') len = Object.keys(row.value).length;
      console.log(`Key: ${row.key}, Type: ${typeof row.value}, Length/Keys: ${len}`);
    });
  } catch (err: any) {
    console.error("Error:", err);
  }
}

run();
