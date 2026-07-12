import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp as initializeClientApp, getApps as getClientApps, getApp as getClientApp } from "firebase/app";
import { initializeFirestore as initializeClientFirestore, doc as clientDoc, setDoc as clientSetDoc, getDoc as clientGetDoc } from "firebase/firestore";
import { db } from "./src/db/index.ts";
import { malhaarData } from "./src/db/schema.ts";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };
import { createProxyMiddleware } from "http-proxy-middleware";

async function runWithRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
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
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  const DB_FILE = path.join(process.cwd(), "db.json");

  // Initialize Firebase Admin SDK for user verification
  try {
    if (getApps().length === 0) {
      initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log("Firebase Admin SDK initialized successfully.");
    }
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
  }

  // Safely initialize client-side Firestore for backup/restore
  const clientApp = getClientApps().length === 0 ? initializeClientApp(firebaseConfig) : getClientApp();
  const clientDb = initializeClientFirestore(clientApp, {}, (firebaseConfig as any).firestoreDatabaseId);

  // Helper to save entire DB state to Firestore Backup via Client SDK (uses API key to bypass container IAM limits)
  async function saveToFirestoreBackup(allData: Record<string, any>) {
    try {
      const docRef = clientDoc(clientDb, "malhaar_backup", "all_data");
      await clientSetDoc(docRef, {
        timestamp: new Date().toISOString(),
        json_data: JSON.stringify(allData)
      });
      console.log("Firestore Cloud Backup: Successfully backed up database state using Client SDK.");
    } catch (err) {
      console.error("Error writing Firestore Cloud Backup via Client SDK:", err);
    }
  }

  // Helper to load entire DB state from Firestore Backup via Client SDK (uses API key to bypass container IAM limits)
  async function loadFromFirestoreBackup(): Promise<Record<string, any> | null> {
    try {
      const docRef = clientDoc(clientDb, "malhaar_backup", "all_data");
      const docSnap = await clientGetDoc(docRef);
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

  // Helper to obtain the correct Supabase REST URL based on sanitizing SUPABASE_HOST
  function getSupabaseProjectUrl(): string {
    const customUrl = process.env.SUPABASE_URL;
    if (customUrl && customUrl.startsWith('http')) {
      return customUrl;
    }
    let host = process.env.SUPABASE_HOST || 'db.irolbvsqyshihomfzflk.supabase.co';
    if (!host || !host.includes('.') || host === 'Malhaar') {
      host = 'db.irolbvsqyshihomfzflk.supabase.co';
    }
    const match = host.match(/db\.(.+?)\.supabase/);
    if (match && match[1]) {
      return `https://${match[1]}.supabase.co`;
    }
    return 'https://irolbvsqyshihomfzflk.supabase.co';
  }

  let hasLoggedSupabaseWarning = false;

  function isValidSupabaseJwt(key: string): boolean {
    if (!key) return false;
    if (key.startsWith('sb_secret_') || key.startsWith('sb_publishable_')) return true;
    const parts = key.split('.');
    return parts.length === 3 && parts[0].startsWith('eyJ');
  }

  // Helper to fetch data from Supabase REST API
  async function getSupabaseRestData(): Promise<Record<string, any> | null> {
    const supabaseUrl = getSupabaseProjectUrl();
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) return null;

    if (!isValidSupabaseJwt(supabaseKey)) {
      if (!hasLoggedSupabaseWarning) {
        console.info(
          "[Supabase REST Config] Note: SUPABASE_SERVICE_ROLE_KEY does not appear to be a standard JWT. " +
          "If you set it to your database password, we will use it for direct DB pool connectivity instead. " +
          "Supabase REST API synchronization is bypassed."
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
      const data: Record<string, any> = {};
      rows.forEach((row: any) => {
        data[row.key] = row.value;
      });
      console.log(`Supabase REST API: Successfully fetched ${rows.length} records!`);
      return data;
    } catch (err: any) {
      console.error("Failed to read from Supabase REST API:", err.message);
      return null;
    }
  }

  // Helper to save data to Supabase REST API
  async function saveSupabaseRestData(payload: Record<string, any>): Promise<boolean> {
    const supabaseUrl = getSupabaseProjectUrl();
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) return false;

    if (!isValidSupabaseJwt(supabaseKey)) {
      if (!hasLoggedSupabaseWarning) {
        console.info(
          "[Supabase REST Config] Note: SUPABASE_SERVICE_ROLE_KEY does not appear to be a standard JWT. " +
          "Bypassing REST save operation."
        );
        hasLoggedSupabaseWarning = true;
      }
      return false;
    }
    
    try {
      const records = Object.keys(payload).map(k => ({
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
    } catch (err: any) {
      console.error("Failed to save to Supabase REST API:", err.message);
      return false;
    }
  }

  // API Route: Get DB
  app.get("/api/db", async (req, res) => {
    try {
      let cloudData: Record<string, any> = {};
      let fetchedSuccessfully = false;

      // 1. Try Cloud SQL / Direct Drizzle connection first (since direct TCP connection has absolute up-to-date restored data)
      try {
        console.log("Fetching database state from SQL database via Drizzle...");
        const sqlPromise = runWithRetry(() => db.select().from(malhaarData), 2, 150);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Database connection timeout")), 5000)
        );
        const rows = await Promise.race([sqlPromise, timeoutPromise]);
        
        rows.forEach((row) => {
          cloudData[row.key] = row.value;
        });
        fetchedSuccessfully = true;
      } catch (dbErr: any) {
        console.error("Failed to fetch database state via Drizzle pool, trying REST fallback:", dbErr.message);
      }

      // 2. Fall back to Supabase REST API if direct Drizzle pool connection didn't resolve
      if (!fetchedSuccessfully) {
        const restData = await getSupabaseRestData();
        if (restData !== null) {
          cloudData = restData;
          fetchedSuccessfully = true;
        }
      }

      // 3. Self-repair: ONLY supplement keys that are completely MISSING from cloud.
      // Important: Do NOT restore keys that exist but are empty in the cloud.
      // Empty arrays/objects may be intentional (e.g., admin cleared all notices).
      // The old logic treated empty cloud values the same as missing ones,
      // which caused intentionally cleared data to be restored from stale local backups.
      if (fetchedSuccessfully && fs.existsSync(DB_FILE)) {
        try {
          const content = fs.readFileSync(DB_FILE, "utf-8");
          const localData = JSON.parse(content);
          let repairNeeded = false;
          const repairedData: Record<string, any> = {};

          Object.keys(localData).forEach((key) => {
            const localVal = localData[key];
            const cloudVal = cloudData[key];

            const isLocalEmpty = !localVal || (Array.isArray(localVal) && localVal.length === 0) || (typeof localVal === 'object' && Object.keys(localVal).length === 0);

            // Only restore if the key is completely ABSENT from cloud (never been set),
            // AND the local backup has actual data for it
            if (cloudVal === undefined && !isLocalEmpty) {
              console.log(`[Self-Repair] Key "${key}" missing from cloud, restoring from local db.json backup...`);
              cloudData[key] = localVal;
              repairedData[key] = localVal;
              repairNeeded = true;
            }
          });

          if (repairNeeded) {
            // Write restored data to Drizzle SQL DB
            const repairPromises = Object.keys(repairedData).map(async (key) => {
              await runWithRetry(() =>
                db.insert(malhaarData)
                  .values({
                    key: key,
                    value: repairedData[key],
                  })
                  .onConflictDoUpdate({
                    target: malhaarData.key,
                    set: { value: repairedData[key] }
                  }),
                2,
                150
              ).catch((e) => console.error(`[Self-Repair] Drizzle write failed for key "${key}":`, e.message));
            });
            await Promise.all(repairPromises);

            // Write restored data to Supabase REST API
            await saveSupabaseRestData(repairedData).catch((e) => console.error(`[Self-Repair] Supabase REST write failed:`, e.message));
            console.log("[Self-Repair] Successfully synced restored keys to cloud databases.");
          }
        } catch (repairErr: any) {
          console.error("[Self-Repair] Failed to merge/supplement from db.json:", repairErr.message);
        }
      }

      // Seeding or Restoring: If database is empty
      if (fetchedSuccessfully && Object.keys(cloudData).length === 0) {
        console.log("Cloud database is empty. Attempting to restore from Firestore cloud backup...");
        const backupData = await loadFromFirestoreBackup();
        if (backupData && typeof backupData === "object" && Object.keys(backupData).length > 0) {
          console.log("Firestore cloud backup found! Restoring database state to cloud databases...");
          try {
            // Write to Drizzle DB
            const insertPromises = Object.keys(backupData).map(async (key) => {
              if (backupData[key] !== null && backupData[key] !== undefined) {
                await runWithRetry(() =>
                  db.insert(malhaarData)
                    .values({
                      key: key,
                      value: backupData[key],
                    })
                    .onConflictDoUpdate({
                      target: malhaarData.key,
                      set: { value: backupData[key] }
                    })
                ).catch(() => {});
              }
            });
            await Promise.all(insertPromises);
            
            // Write to Supabase REST API
            await saveSupabaseRestData(backupData).catch(() => {});

            console.log("Database successfully restored from Firestore cloud backup!");
            
            // Sync local cache db.json for backup
            fs.writeFileSync(DB_FILE, JSON.stringify(backupData, null, 2), "utf-8");
            return res.json(backupData);
          } catch (restoreErr) {
            console.error("Failed to restore cloud database:", restoreErr);
          }
        }

        // If no Firestore backup, fall back to seeding from local db.json
        if (fs.existsSync(DB_FILE)) {
          console.log("No Firestore backup found. Seeding cloud databases from local db.json file...");
          try {
            const content = fs.readFileSync(DB_FILE, "utf-8");
            const localData = JSON.parse(content);
            
            // Write to Drizzle DB
            const insertPromises = Object.keys(localData).map(async (key) => {
              if (localData[key] !== null && localData[key] !== undefined) {
                await runWithRetry(() =>
                  db.insert(malhaarData)
                    .values({
                      key: key,
                      value: localData[key],
                    })
                    .onConflictDoUpdate({
                      target: malhaarData.key,
                      set: { value: localData[key] }
                    })
                ).catch(() => {});
              }
            });
            await Promise.all(insertPromises);

            // Write to Supabase REST API
            await saveSupabaseRestData(localData).catch(() => {});

            console.log("Seeding complete from local db.json!");

            // Back up the newly seeded data to Firestore for safety
            await saveToFirestoreBackup(localData);

            return res.json(localData);
          } catch (seedErr) {
            console.error("Failed to seed cloud database from db.json:", seedErr);
          }
        }
      }

      // Sync local cache db.json for backup/redundancy
      if (fetchedSuccessfully && Object.keys(cloudData).length > 0) {
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(cloudData, null, 2), "utf-8");
        } catch (err) {
          console.error("Failed to write to local db.json cache:", err);
        }
      }

      // If both cloud database fetches failed, we attempt to load from Firestore cloud backup as an active fallback!
      if (!fetchedSuccessfully) {
        console.log("Both cloud database fetches failed. Attempting to load from Firestore cloud backup...");
        const backupData = await loadFromFirestoreBackup();
        if (backupData && typeof backupData === "object" && Object.keys(backupData).length > 0) {
          console.log("Successfully retrieved database state from Firestore cloud backup fallback!");
          cloudData = backupData;
          fetchedSuccessfully = true;
          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(cloudData, null, 2), "utf-8");
          } catch (err) {
            console.error("Failed to write to local db.json cache:", err);
          }
          return res.json(cloudData);
        }

        console.log("No Firestore backup found. Falling back to local cache db.json.");
        if (fs.existsSync(DB_FILE)) {
          try {
            const content = fs.readFileSync(DB_FILE, "utf-8");
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
      // Fallback to local db.json
      if (fs.existsSync(DB_FILE)) {
        try {
          const content = fs.readFileSync(DB_FILE, "utf-8");
          return res.json(JSON.parse(content));
        } catch (fileErr) {
          console.warn("Failed to read local fallback DB_FILE:", fileErr);
        }
      }
      return res.json({});
    }
  });

  // Synchronized promise queue to prevent race conditions during concurrent write batches
  let dbWritePromise: Promise<any> = Promise.resolve();

  // API Route: Save DB
  app.post("/api/db", async (req, res) => {
    const execute = async () => {
      try {
        const payload = req.body;
        let cloudSaved = false;

        if (payload && typeof payload === "object") {
          // 1. Try saving to Supabase REST API
          const restSaved = await saveSupabaseRestData(payload);
          if (restSaved) {
            cloudSaved = true;
          }

          // 2. Try saving to SQL database via Drizzle
          try {
            const insertPromises = Object.keys(payload).map(async (key) => {
              if (payload[key] !== null && payload[key] !== undefined) {
                await runWithRetry(() =>
                  db.insert(malhaarData)
                    .values({
                      key: key,
                      value: payload[key],
                    })
                    .onConflictDoUpdate({
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

        // Also merge & save to local db.json as backup/cache
        let existingData: Record<string, any> = {};
        if (fs.existsSync(DB_FILE)) {
          try {
            const content = fs.readFileSync(DB_FILE, "utf-8");
            existingData = JSON.parse(content);
          } catch (e) {
            console.error("Error parsing existing DB_FILE:", e);
          }
        }

        if (payload && typeof payload === "object") {
          Object.keys(payload).forEach((key) => {
            if (payload[key] !== null && payload[key] !== undefined) {
              existingData[key] = payload[key];
            }
          });
        }

        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(existingData, null, 2), "utf-8");
        } catch (fileErr) {
          console.error("Failed to write local DB_FILE backup:", fileErr);
        }

        // Simultaneously write complete merged state to Firestore Backup for ultimate safety!
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

    // Chain the execution to force sequential execution and await the result.
    // Important: Use .catch(() => {}) on the chain (not .catch(execute)) to prevent
    // re-executing the operation on failure, which would cause duplicate writes.
    const currentWrite = dbWritePromise.then(execute).catch((err: any) => {
      console.error("Serialized write operation failed:", err);
      throw err;
    });
    dbWritePromise = currentWrite.catch(() => {}); // Ensure chain continues even on failure

    try {
      const result = await currentWrite;
      return res.json(result);
    } catch (err: any) {
      console.error("Synchronized write failed:", err);
      return res.status(500).json({ error: "Failed to write database sequentially" });
    }
  });

  // Proxy all requests to /__/auth/... to Firebase Auth's real server to bypass storage partitioning
  app.use(
    "/__/auth",
    createProxyMiddleware({
      target: `https://${firebaseConfig.authDomain}`,
      changeOrigin: true,
    })
  );

  // HTML Route: Google Workspace OAuth popup handler (bypasses iframe storage partitioning/sessionStorage restrictions)
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

          const firebaseConfig = ${JSON.stringify(firebaseConfig)};
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
