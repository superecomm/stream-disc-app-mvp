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

if (typeof window !== "undefined") {
  // Only initialize if we have the required config
  if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId) {
    try {
      if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
      } else {
        firebaseApp = getApps()[0];
      }
      auth = getAuth(firebaseApp);
      db = getFirestore(firebaseApp);
      
      // Initialize Analytics only in browser and if measurementId is provided
      if (firebaseConfig.measurementId && typeof window !== "undefined") {
        try {
          analytics = getAnalytics(firebaseApp);
        } catch (error) {
          // Analytics might fail in development, that's okay
          console.warn("Firebase Analytics initialization skipped:", error);
        }
      }
      
      console.log("✅ Firebase initialized successfully");
    } catch (error) {
      console.error("❌ Firebase initialization error:", error);
    }
  } else {
    console.error("❌ Firebase configuration is missing. Missing values:", {
      apiKey: !!firebaseConfig.apiKey,
      authDomain: !!firebaseConfig.authDomain,
      projectId: !!firebaseConfig.projectId,
      appId: !!firebaseConfig.appId,
    });
    console.error("Please create .env.local file in the project root with your Firebase credentials.");
  }
}

export { firebaseApp, auth, db, analytics };

