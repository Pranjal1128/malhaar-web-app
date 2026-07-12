import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

async function run() {
  try {
    const clientApp = initializeApp(firebaseConfig);
    const clientDb = initializeFirestore(clientApp, {}, (firebaseConfig as any).firestoreDatabaseId);
    const docRef = doc(clientDb, "malhaar_backup", "all_data");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.json_data) {
        const parsed = JSON.parse(data.json_data);
        console.log("Firestore cloud backup has keys:", Object.keys(parsed));
        console.log("Backup - core_members count:", parsed.core_members?.length);
        console.log("Backup - timetable count:", parsed.timetable?.length);
        console.log("Backup - profiles count:", parsed.profiles?.length);
        console.log("Backup - performance count:", parsed.performance?.length);
        
        // Output some samples
        if (parsed.timetable) {
          console.log("Backup - Timetable:", JSON.stringify(parsed.timetable, null, 2).slice(0, 500));
        }
        if (parsed.core_members) {
          console.log("Backup - Core Members:", JSON.stringify(parsed.core_members, null, 2).slice(0, 500));
        }
        if (parsed.profiles) {
          console.log("Backup - Profiles count:", parsed.profiles.length);
          const sampleProfiles = parsed.profiles.map((p: any) => ({ name: p.name, email: p.email }));
          console.log("Backup - Profiles:", sampleProfiles);
        }
      } else {
        console.log("No json_data in backup.");
      }
    } else {
      console.log("Document does not exist.");
    }
  } catch (err: any) {
    console.error("Error:", err);
  }
}

run();
