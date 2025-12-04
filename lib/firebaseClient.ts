import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let analytics: Analytics | undefined;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const hasRequiredConfig =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.authDomain) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.appId);

if (typeof window !== "undefined" && hasRequiredConfig) {
  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApps()[0];
    }
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);

    // Initialize Analytics only in browser and if measurementId is provided
    if (firebaseConfig.measurementId) {
      try {
        analytics = getAnalytics(firebaseApp);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Firebase Analytics initialization skipped:", error);
        }
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Firebase initialized successfully");
    }
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
  }
} else if (typeof window !== "undefined" && !hasRequiredConfig && process.env.NODE_ENV !== "production") {
  console.info("[Firebase] Client config missing. Skipping initialization for this session.");
}

export { firebaseApp, auth, db, analytics };

