import { db } from "./src/db/index.ts";
import { malhaarData } from "./src/db/schema.ts";
import * as fs from "fs";
import * as path from "path";

async function run() {
  try {
    console.log("Starting manual restoration script...");
    const dbPath = path.join(process.cwd(), "db.json");
    if (!fs.existsSync(dbPath)) {
      console.error("db.json not found in workspace root!");
      return;
    }

    const content = fs.readFileSync(dbPath, "utf-8");
    const localData = JSON.parse(content);
    const keys = Object.keys(localData);
    console.log(`Found ${keys.length} keys in db.json. Syncing to Cloud SQL...`);

    for (const key of keys) {
      const val = localData[key];
      if (val !== null && val !== undefined) {
        console.log(`Restoring key: "${key}" (type: ${Array.isArray(val) ? "array" : typeof val})`);
        await db.insert(malhaarData)
          .values({
            key: key,
            value: val,
          })
          .onConflictDoUpdate({
            target: malhaarData.key,
            set: { value: val }
          });
      }
    }
    console.log("Restoration completed successfully!");
  } catch (err: any) {
    console.error("Restoration failed with error:", err);
  }
}

run();
