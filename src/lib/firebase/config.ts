import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const assertFirebaseConfig = () => {
  if (!firebaseConfig.apiKey) {
    throw new Error(
      "Missing Firebase API key. Set NEXT_PUBLIC_FIREBASE_API_KEY in your environment."
    );
  }
  if (!firebaseConfig.authDomain) {
    throw new Error(
      "Missing Firebase auth domain. Set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN in your environment."
    );
  }
  if (!firebaseConfig.projectId) {
    throw new Error(
      "Missing Firebase project ID. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID in your environment."
    );
  }
  if (!firebaseConfig.storageBucket) {
    throw new Error(
      "Missing Firebase storage bucket. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in your environment."
    );
  }
  if (!firebaseConfig.messagingSenderId) {
    throw new Error(
      "Missing Firebase messaging sender ID. Set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID in your environment."
    );
  }
  if (!firebaseConfig.appId) {
    throw new Error(
      "Missing Firebase app ID. Set NEXT_PUBLIC_FIREBASE_APP_ID in your environment."
    );
  }
};

let app: FirebaseApp | undefined;

const getFirebaseApp = (): FirebaseApp => {
  if (typeof window === "undefined") {
    throw new Error(
      "Firebase can only be initialized in the browser. Make sure you only use Firebase from client-side code."
    );
  }

  if (!app) {
    assertFirebaseConfig();
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }

  return app;
};

export const getFirebaseAuth = (): Auth => {
  return getAuth(getFirebaseApp());
};

export const getFirestoreDb = (): Firestore => {
  return getFirestore(getFirebaseApp());
};

export const getFirebaseStorage = (): FirebaseStorage => {
  return getStorage(getFirebaseApp());
};
