import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import * as fs from "fs";

// Load firebase-applet-config.json
const configPath = "./firebase-applet-config.json";
if (!fs.existsSync(configPath)) {
  console.error("firebase-applet-config.json not found!");
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkBackup() {
  try {
    console.log("Checking Firestore backup...");
    const docRef = doc(db, "malhaar_backup", "all_data");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("Firestore backup exists!");
      const data = docSnap.data();
      if (data && data.json_data) {
        const parsed = JSON.parse(data.json_data);
        console.log("Keys in backup:", Object.keys(parsed));
        if (parsed.profiles) {
          console.log("Profiles count in backup:", parsed.profiles.length);
          console.log("Names in backup:", parsed.profiles.map((p: any) => p.name));
        } else {
          console.log("No profiles key in backup.");
        }
      } else {
        console.log("No json_data field in Firestore backup.");
      }
    } else {
      console.log("No malhaar_backup/all_data document in Firestore.");
    }
  } catch (err: any) {
    console.error("Firestore backup check error:", err.message);
  }
  process.exit(0);
}

checkBackup();
