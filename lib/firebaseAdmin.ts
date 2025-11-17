import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminFirestore: Firestore | null = null;

function initializeAdmin() {
  if (adminApp && adminFirestore) {
    return { adminApp, adminFirestore };
  }

  if (!getApps().length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      const missing = [];
      if (!process.env.FIREBASE_PROJECT_ID) missing.push("FIREBASE_PROJECT_ID");
      if (!process.env.FIREBASE_CLIENT_EMAIL) missing.push("FIREBASE_CLIENT_EMAIL");
      if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");
      throw new Error(`Missing Firebase Admin environment variables: ${missing.join(", ")}. Please check your .env.local file.`);
    }

    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } else {
    adminApp = getApps()[0];
  }

  adminFirestore = getFirestore(adminApp);
  return { adminApp, adminFirestore };
}

// Lazy initialization - only called at runtime
export function getAdminFirestore(): Firestore {
  const { adminFirestore } = initializeAdmin();
  if (!adminFirestore) {
    throw new Error("Firebase Admin not initialized. Check environment variables.");
  }
  return adminFirestore;
}

export function getAdminApp(): App {
  const { adminApp } = initializeAdmin();
  if (!adminApp) {
    throw new Error("Firebase Admin not initialized. Check environment variables.");
  }
  return adminApp;
}

