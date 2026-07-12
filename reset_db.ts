import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

if (getApps().length === 0) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
const db = getFirestore();
db.doc("malhaar_backup/all_data").delete().then(() => {
  console.log("Firestore backup cleared!");
  process.exit(0);
}).catch(console.error);
