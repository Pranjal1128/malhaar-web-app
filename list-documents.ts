import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, getDocs } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

async function run() {
  try {
    const clientApp = initializeApp(firebaseConfig);
    const clientDb = initializeFirestore(clientApp, {}, (firebaseConfig as any).firestoreDatabaseId);
    
    // Let's list documents in "malhaar_backup"
    const colRef = collection(clientDb, "malhaar_backup");
    const querySnapshot = await getDocs(colRef);
    console.log("Documents in 'malhaar_backup':");
    querySnapshot.forEach((doc) => {
      console.log("Document ID:", doc.id);
    });
  } catch (err: any) {
    console.error("Error:", err);
  }
}

run();
