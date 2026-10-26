var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_app = require("firebase-admin/app");
var import_app2 = require("firebase/app");
var import_firestore = require("firebase/firestore");

// src/db/index.ts
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = __toESM(require("pg"), 1);

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  malhaarData: () => malhaarData,
  users: () => users
});
var import_pg_core = require("drizzle-orm/pg-core");
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  uid: (0, import_pg_core.text)("uid").notNull().unique(),
  // Firebase Auth UID
  email: (0, import_pg_core.text)("email").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var malhaarData = (0, import_pg_core.pgTable)("malhaar_data", {
  key: (0, import_pg_core.text)("key").primaryKey(),
  value: (0, import_pg_core.jsonb)("value").notNull()
});

// src/db/index.ts
var { Pool } = import_pg.default;
var createPool = () => {
  if (process.env.DATABASE_URL) {
    console.log("Connecting database pool using DATABASE_URL...");
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 1e4,
      keepAlive: true,
      connectionTimeoutMillis: 5e3,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  let SUPABASE_HOST = process.env.SUPABASE_HOST || "db.irolbvsqyshihomfzflk.supabase.co";
  if (!SUPABASE_HOST || !SUPABASE_HOST.includes(".") || SUPABASE_HOST === "Malhaar") {
    SUPABASE_HOST = "db.irolbvsqyshihomfzflk.supabase.co";
  }
  const SUPABASE_USER = process.env.SUPABASE_USER || "postgres";
  let SUPABASE_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_PASSWORD && SUPABASE_SERVICE_ROLE_KEY) {
    const isJwt = SUPABASE_SERVICE_ROLE_KEY.split(".").length === 3 && SUPABASE_SERVICE_ROLE_KEY.split(".")[0].startsWith("eyJ");
    const isSbToken = SUPABASE_SERVICE_ROLE_KEY.startsWith("sb_secret_");
    if (!isJwt && !isSbToken) {
      SUPABASE_PASSWORD = SUPABASE_SERVICE_ROLE_KEY;
    }
  }
  const SUPABASE_DB_NAME = process.env.SUPABASE_DB_NAME || "postgres";
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
      idleTimeoutMillis: 1e4,
      keepAlive: true,
      connectionTimeoutMillis: 5e3,
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
    idleTimeoutMillis: 1e4,
    keepAlive: true,
    connectionTimeoutMillis: 3e3
  });
};
var pool = createPool();
pool.on("error", (err) => {
  console.error("Unexpected error on idle SQL pool client:", err);
});
var db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "axiomatic-line-mn56p",
  appId: "1:282352398449:web:6788ab0514711218bcabd0",
  apiKey: "AIzaSyD_vAuxlX9-v4vDJf9rNdfUW9oY9jDJZoQ",
  authDomain: "axiomatic-line-mn56p.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-remixremixmalhaa-b831fe66-b54a-4711-b756-d0df0275e985",
  storageBucket: "axiomatic-line-mn56p.firebasestorage.app",
  messagingSenderId: "282352398449",
  measurementId: "",
  oAuthClientId: "282352398449-jp6uoti79a93gdhu8o7jf274fb6s9cjd.apps.googleusercontent.com"
};

// server.ts
var import_http_proxy_middleware = require("http-proxy-middleware");
async function runWithRetry(operation, retries = 3, delay = 1e3) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      console.warn(`Database operation failed (attempt ${attempt}/${retries}):`, err.message || err);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }
  throw lastError;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  const DB_FILE = import_path.default.join(process.cwd(), "db.json");
  try {
    if ((0, import_app.getApps)().length === 0) {
      (0, import_app.initializeApp)({
        projectId: firebase_applet_config_default.projectId
      });
      console.log("Firebase Admin SDK initialized successfully.");
    }
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
  }
  const clientApp = (0, import_app2.getApps)().length === 0 ? (0, import_app2.initializeApp)(firebase_applet_config_default) : (0, import_app2.getApp)();
  const clientDb = (0, import_firestore.initializeFirestore)(clientApp, {}, firebase_applet_config_default.firestoreDatabaseId);
  async function saveToFirestoreBackup(allData) {
    try {
      const docRef = (0, import_firestore.doc)(clientDb, "malhaar_backup", "all_data");
      await (0, import_firestore.setDoc)(docRef, {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        json_data: JSON.stringify(allData)
      });
      console.log("Firestore Cloud Backup: Successfully backed up database state using Client SDK.");
    } catch (err) {
      console.error("Error writing Firestore Cloud Backup via Client SDK:", err);
    }
  }
  async function loadFromFirestoreBackup() {
    try {
      const docRef = (0, import_firestore.doc)(clientDb, "malhaar_backup", "all_data");
      const docSnap = await (0, import_firestore.getDoc)(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.json_data) {
          const parsed = JSON.parse(data.json_data);
          console.log("Firestore Cloud Backup: Successfully retrieved database state using Client SDK.");
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error reading Firestore Cloud Backup via Client SDK:", err);
    }
    return null;
  }
  function getSupabaseProjectUrl() {
    const customUrl = process.env.SUPABASE_URL;
    if (customUrl && customUrl.startsWith("http")) {
      return customUrl;
    }
    let host = process.env.SUPABASE_HOST || "db.irolbvsqyshihomfzflk.supabase.co";
    if (!host || !host.includes(".") || host === "Malhaar") {
      host = "db.irolbvsqyshihomfzflk.supabase.co";
    }
    const match = host.match(/db\.(.+?)\.supabase/);
    if (match && match[1]) {
      return `https://${match[1]}.supabase.co`;
    }
    return "https://irolbvsqyshihomfzflk.supabase.co";
  }
  let hasLoggedSupabaseWarning = false;
  function isValidSupabaseJwt(key) {
    if (!key) return false;
    if (key.startsWith("sb_secret_") || key.startsWith("sb_publishable_")) return true;
    const parts = key.split(".");
    return parts.length === 3 && parts[0].startsWith("eyJ");
  }
  async function getSupabaseRestData() {
    const supabaseUrl = getSupabaseProjectUrl();
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return null;
    if (!isValidSupabaseJwt(supabaseKey)) {
      if (!hasLoggedSupabaseWarning) {
        console.info(
          "[Supabase REST Config] Note: SUPABASE_SERVICE_ROLE_KEY does not appear to be a standard JWT. If you set it to your database password, we will use it for direct DB pool connectivity instead. Supabase REST API synchronization is bypassed."
        );
        hasLoggedSupabaseWarning = true;
      }
      return null;
    }
    try {
      console.log("Attempting to fetch data from Supabase REST API URL:", supabaseUrl);
      const url = `${supabaseUrl}/rest/v1/malhaar_data`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      });
      if (response.status === 404) {
        console.warn("Supabase REST API Warning: Table 'malhaar_data' not found in public schema. Please run the SQL migration script in your Supabase Dashboard SQL Editor!");
        return null;
      }
      if (!response.ok) {
        throw new Error(`REST API returned status ${response.status}`);
      }
      const rows = await response.json();
      const data = {};
      rows.forEach((row) => {
        data[row.key] = row.value;
      });
      console.log(`Supabase REST API: Successfully fetched ${rows.length} records!`);
      return data;
    } catch (err) {
      console.error("Failed to read from Supabase REST API:", err.message);
      return null;
    }
  }
  async function saveSupabaseRestData(payload) {
    const supabaseUrl = getSupabaseProjectUrl();
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return false;
    if (!isValidSupabaseJwt(supabaseKey)) {
      if (!hasLoggedSupabaseWarning) {
        console.info(
          "[Supabase REST Config] Note: SUPABASE_SERVICE_ROLE_KEY does not appear to be a standard JWT. Bypassing REST save operation."
        );
        hasLoggedSupabaseWarning = true;
      }
      return false;
    }
    try {
      const records = Object.keys(payload).map((k) => ({
        key: k,
        value: payload[k]
      }));
      if (records.length === 0) return true;
      console.log(`Saving ${records.length} records to Supabase REST API...`);
      const url = `${supabaseUrl}/rest/v1/malhaar_data`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(records)
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`REST API returned status ${response.status}: ${errText}`);
      }
      console.log("Successfully upserted data to Supabase via REST API.");
      return true;
    } catch (err) {
      console.error("Failed to save to Supabase REST API:", err.message);
      return false;
    }
  }
  app.get("/api/db", async (req, res) => {
    try {
      let cloudData = {};
      let fetchedSuccessfully = false;
      try {
        console.log("Fetching database state from SQL database via Drizzle...");
        const sqlPromise = runWithRetry(() => db.select().from(malhaarData), 2, 150);
        const timeoutPromise = new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Database connection timeout")), 5e3)
        );
        const rows = await Promise.race([sqlPromise, timeoutPromise]);
        rows.forEach((row) => {
          cloudData[row.key] = row.value;
        });
        fetchedSuccessfully = true;
      } catch (dbErr) {
        console.error("Failed to fetch database state via Drizzle pool, trying REST fallback:", dbErr.message);
      }
      if (!fetchedSuccessfully) {
        const restData = await getSupabaseRestData();
        if (restData !== null) {
          cloudData = restData;
          fetchedSuccessfully = true;
        }
      }
      if (fetchedSuccessfully && import_fs.default.existsSync(DB_FILE)) {
        try {
          const content = import_fs.default.readFileSync(DB_FILE, "utf-8");
          const localData = JSON.parse(content);
          let repairNeeded = false;
          const repairedData = {};
          Object.keys(localData).forEach((key) => {
            const localVal = localData[key];
            const cloudVal = cloudData[key];
            const isLocalEmpty = !localVal || Array.isArray(localVal) && localVal.length === 0 || typeof localVal === "object" && Object.keys(localVal).length === 0;
            if (cloudVal === void 0 && !isLocalEmpty) {
              console.log(`[Self-Repair] Key "${key}" missing from cloud, restoring from local db.json backup...`);
              cloudData[key] = localVal;
              repairedData[key] = localVal;
              repairNeeded = true;
            }
          });
          if (repairNeeded) {
            const repairPromises = Object.keys(repairedData).map(async (key) => {
              await runWithRetry(
                () => db.insert(malhaarData).values({
                  key,
                  value: repairedData[key]
                }).onConflictDoUpdate({
                  target: malhaarData.key,
                  set: { value: repairedData[key] }
                }),
                2,
                150
              ).catch((e) => console.error(`[Self-Repair] Drizzle write failed for key "${key}":`, e.message));
            });
            await Promise.all(repairPromises);
            await saveSupabaseRestData(repairedData).catch((e) => console.error(`[Self-Repair] Supabase REST write failed:`, e.message));
            console.log("[Self-Repair] Successfully synced restored keys to cloud databases.");
          }
        } catch (repairErr) {
          console.error("[Self-Repair] Failed to merge/supplement from db.json:", repairErr.message);
        }
      }
      if (fetchedSuccessfully && Object.keys(cloudData).length === 0) {
        console.log("Cloud database is empty. Attempting to restore from Firestore cloud backup...");
        const backupData = await loadFromFirestoreBackup();
        if (backupData && typeof backupData === "object" && Object.keys(backupData).length > 0) {
          console.log("Firestore cloud backup found! Restoring database state to cloud databases...");
          try {
            const insertPromises = Object.keys(backupData).map(async (key) => {
              if (backupData[key] !== null && backupData[key] !== void 0) {
                await runWithRetry(
                  () => db.insert(malhaarData).values({
                    key,
                    value: backupData[key]
                  }).onConflictDoUpdate({
                    target: malhaarData.key,
                    set: { value: backupData[key] }
                  })
                ).catch(() => {
                });
              }
            });
            await Promise.all(insertPromises);
            await saveSupabaseRestData(backupData).catch(() => {
            });
            console.log("Database successfully restored from Firestore cloud backup!");
            import_fs.default.writeFileSync(DB_FILE, JSON.stringify(backupData, null, 2), "utf-8");
            return res.json(backupData);
          } catch (restoreErr) {
            console.error("Failed to restore cloud database:", restoreErr);
          }
        }
        if (import_fs.default.existsSync(DB_FILE)) {
          console.log("No Firestore backup found. Seeding cloud databases from local db.json file...");
          try {
            const content = import_fs.default.readFileSync(DB_FILE, "utf-8");
            const localData = JSON.parse(content);
            const insertPromises = Object.keys(localData).map(async (key) => {
              if (localData[key] !== null && localData[key] !== void 0) {
                await runWithRetry(
                  () => db.insert(malhaarData).values({
                    key,
                    value: localData[key]
                  }).onConflictDoUpdate({
                    target: malhaarData.key,
                    set: { value: localData[key] }
                  })
                ).catch(() => {
                });
              }
            });
            await Promise.all(insertPromises);
            await saveSupabaseRestData(localData).catch(() => {
            });
            console.log("Seeding complete from local db.json!");
            await saveToFirestoreBackup(localData);
            return res.json(localData);
          } catch (seedErr) {
            console.error("Failed to seed cloud database from db.json:", seedErr);
          }
        }
      }
      if (fetchedSuccessfully && Object.keys(cloudData).length > 0) {
        try {
          import_fs.default.writeFileSync(DB_FILE, JSON.stringify(cloudData, null, 2), "utf-8");
        } catch (err) {
          console.error("Failed to write to local db.json cache:", err);
        }
      }
      if (!fetchedSuccessfully) {
        console.log("Both cloud database fetches failed. Attempting to load from Firestore cloud backup...");
        const backupData = await loadFromFirestoreBackup();
        if (backupData && typeof backupData === "object" && Object.keys(backupData).length > 0) {
          console.log("Successfully retrieved database state from Firestore cloud backup fallback!");
          cloudData = backupData;
          fetchedSuccessfully = true;
          try {
            import_fs.default.writeFileSync(DB_FILE, JSON.stringify(cloudData, null, 2), "utf-8");
          } catch (err) {
            console.error("Failed to write to local db.json cache:", err);
          }
          return res.json(cloudData);
        }
        console.log("No Firestore backup found. Falling back to local cache db.json.");
        if (import_fs.default.existsSync(DB_FILE)) {
          try {
            const content = import_fs.default.readFileSync(DB_FILE, "utf-8");
            return res.json(JSON.parse(content));
          } catch (fileErr) {
            console.warn("Failed to read local fallback DB_FILE:", fileErr);
          }
        }
        return res.json({});
      }
      return res.json(cloudData);
    } catch (error) {
      console.warn("Unexpected database fetch error, falling back to local file:", error);
      if (import_fs.default.existsSync(DB_FILE)) {
        try {
          const content = import_fs.default.readFileSync(DB_FILE, "utf-8");
          return res.json(JSON.parse(content));
        } catch (fileErr) {
          console.warn("Failed to read local fallback DB_FILE:", fileErr);
        }
      }
      return res.json({});
    }
  });
  let dbWritePromise = Promise.resolve();
  app.post("/api/db", async (req, res) => {
    const execute = async () => {
      try {
        const payload = req.body;
        let cloudSaved = false;
        if (payload && typeof payload === "object") {
          const restSaved = await saveSupabaseRestData(payload);
          if (restSaved) {
            cloudSaved = true;
          }
          try {
            const insertPromises = Object.keys(payload).map(async (key) => {
              if (payload[key] !== null && payload[key] !== void 0) {
                await runWithRetry(
                  () => db.insert(malhaarData).values({
                    key,
                    value: payload[key]
                  }).onConflictDoUpdate({
                    target: malhaarData.key,
                    set: { value: payload[key] }
                  }),
                  2,
                  150
                );
              }
            });
            await Promise.all(insertPromises);
            console.log("Successfully saved change batch to Drizzle SQL database.");
            cloudSaved = true;
          } catch (dbErr) {
            console.error("Failed to write to Drizzle database, falling back to JSON cache/Firestore:", dbErr);
          }
        }
        let existingData = {};
        if (import_fs.default.existsSync(DB_FILE)) {
          try {
            const content = import_fs.default.readFileSync(DB_FILE, "utf-8");
            existingData = JSON.parse(content);
          } catch (e) {
            console.error("Error parsing existing DB_FILE:", e);
          }
        }
        if (payload && typeof payload === "object") {
          Object.keys(payload).forEach((key) => {
            if (payload[key] !== null && payload[key] !== void 0) {
              existingData[key] = payload[key];
            }
          });
        }
        try {
          import_fs.default.writeFileSync(DB_FILE, JSON.stringify(existingData, null, 2), "utf-8");
        } catch (fileErr) {
          console.error("Failed to write local DB_FILE backup:", fileErr);
        }
        if (payload && typeof payload === "object" && Object.keys(payload).length > 0) {
          saveToFirestoreBackup(existingData).catch((firestoreErr) => {
            console.error("Asynchronous Firestore backup write failed:", firestoreErr);
          });
        }
        return {
          status: "success",
          sync: cloudSaved ? "cloud" : "local_only"
        };
      } catch (error) {
        console.error("Error inside synchronized database writer:", error);
        throw error;
      }
    };
    const currentWrite = dbWritePromise.then(execute).catch((err) => {
      console.error("Serialized write operation failed:", err);
      throw err;
    });
    dbWritePromise = currentWrite.catch(() => {
    });
    try {
      const result = await currentWrite;
      return res.json(result);
    } catch (err) {
      console.error("Synchronized write failed:", err);
      return res.status(500).json({ error: "Failed to write database sequentially" });
    }
  });
  app.use(
    "/__/auth",
    (0, import_http_proxy_middleware.createProxyMiddleware)({
      target: `https://${firebase_applet_config_default.authDomain}`,
      changeOrigin: true
    })
  );
  app.get("/oauth-popup", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connect Google Workspace</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #121214;
            color: #f1f1f3;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            overflow: hidden;
          }
          .card {
            background: #1c1c1e;
            border: 1px solid #2c2c2e;
            padding: 32px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            max-width: 400px;
            width: 80%;
          }
          .spinner {
            border: 4px solid rgba(255, 255, 255, 0.05);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border-left-color: #D98353;
            animation: spin 0.8s linear infinite;
            margin-bottom: 24px;
            display: none;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h2 {
            font-weight: 500;
            margin: 0 0 12px 0;
            font-size: 1.4rem;
            color: #ffffff;
            letter-spacing: -0.025em;
          }
          p {
            color: #9ba1a6;
            font-size: 0.95rem;
            line-height: 1.5;
            margin: 0 0 24px 0;
          }
          
          /* Official Google Sign-In button styles */
          .gsi-material-button {
            -moz-user-select: none;
            -webkit-user-select: none;
            -ms-user-select: none;
            -webkit-appearance: none;
            background-color: #131314;
            background-image: none;
            border: 1px solid #747775;
            -webkit-border-radius: 20px;
            border-radius: 20px;
            -webkit-box-sizing: border-box;
            box-sizing: border-box;
            color: #e3e3e3;
            cursor: pointer;
            font-family: 'Roboto', arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            height: 40px;
            letter-spacing: 0.25px;
            outline: none;
            overflow: hidden;
            padding: 0 16px;
            position: relative;
            text-align: center;
            -webkit-transition: background-color .218s, border-color .218s, box-shadow .218s;
            transition: background-color .218s, border-color .218s, box-shadow .218s;
            vertical-align: middle;
            white-space: nowrap;
            width: auto;
            min-width: 220px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          }
          .gsi-material-button .gsi-material-button-icon {
            height: 20px;
            margin-right: 12px;
            min-width: 20px;
            width: 20px;
          }
          .gsi-material-button .gsi-material-button-content-wrapper {
            align-items: center;
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            height: 100%;
            justify-content: space-between;
            position: relative;
            width: 100%;
          }
          .gsi-material-button .gsi-material-button-contents {
            flex-grow: 1;
            font-family: 'Google Sans', arial, sans-serif;
            font-weight: 500;
            letter-spacing: 0.25px;
          }
          .gsi-material-button:hover {
            background-color: #202124;
            border-color: #8e918f;
          }
          .gsi-material-button:active {
            background-color: #303134;
          }
        </style>
        <script type="module">
          import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
          import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

          const firebaseConfig = ${JSON.stringify(firebase_applet_config_default)};
          // Override authDomain to the current window host to route through our server proxy
          firebaseConfig.authDomain = window.location.host;
          const app = initializeApp(firebaseConfig);
          const auth = getAuth(app);
          const provider = new GoogleAuthProvider();

          // Add the identical Google Workspace scopes requested
          const SCOPES = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/meetings.space.created',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
          ];
          SCOPES.forEach(scope => provider.addScope(scope));

          provider.setCustomParameters({
            prompt: 'consent'
          });

          const signinBtn = document.getElementById('signin-button');
          const statusText = document.getElementById('status');
          const spinner = document.getElementById('spinner');

          async function handleSignIn() {
            try {
              signinBtn.style.display = 'none';
              spinner.style.display = 'block';
              statusText.innerText = "Connecting to Google...";

              const result = await signInWithPopup(auth, provider);
              const credential = GoogleAuthProvider.credentialFromResult(result);
              if (!credential?.accessToken) {
                throw new Error('Failed to retrieve Google OAuth access token.');
              }

              statusText.innerText = "Connection successful! Syncing back...";
              if (window.opener) {
                const serializableUser = typeof result.user.toJSON === 'function'
                  ? result.user.toJSON()
                  : {
                      uid: result.user.uid,
                      email: result.user.email,
                      displayName: result.user.displayName,
                      photoURL: result.user.photoURL,
                      emailVerified: result.user.emailVerified
                    };

                window.opener.postMessage({
                  type: 'FIREBASE_AUTH_SUCCESS',
                  user: serializableUser,
                  accessToken: credential.accessToken
                }, '*');
                setTimeout(() => {
                  window.close();
                }, 1000);
              } else {
                statusText.innerText = "Connection successful. You can close this window.";
                spinner.style.display = 'none';
              }
            } catch (error) {
              console.error(error);
              statusText.innerText = "Authentication Failed";
              spinner.style.display = 'none';
              signinBtn.style.display = 'inline-flex';
              
              const isUserCancelled = error.code === 'auth/popup-closed-by-user' || error.message.includes('popup-closed-by-user');
              const errMsg = isUserCancelled ? 'Sign-in popup closed before completion.' : error.message;
              
              if (window.opener) {
                window.opener.postMessage({
                  type: 'FIREBASE_AUTH_FAILURE',
                  error: errMsg
                }, '*');
              }
            }
          }

          signinBtn.addEventListener('click', handleSignIn);
        </script>
      </head>
      <body>
        <div class="card">
          <div class="spinner" id="spinner"></div>
          <h2 id="status">Sync Google Workspace</h2>
          <p id="desc">Authorize Malhaar to connect with your Google Calendar, Drive, Gmail, Sheets, and Meet space creator.</p>
          
          <button class="gsi-material-button" id="signin-button">
            <div class="gsi-material-button-content-wrapper">
              <div class="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="display: block;">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span class="gsi-material-button-contents">Sign in with Google</span>
            </div>
          </button>
        </div>
      </body>
      </html>
    `);
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
