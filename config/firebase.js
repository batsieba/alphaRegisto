// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyDasEdibjMVzxROjF_DbR6jmVBdioHcfF0",
  authDomain: "alpharegisto-c4f6e.firebaseapp.com",
  projectId: "alpharegisto-c4f6e",
  storageBucket: "alpharegisto-c4f6e.firebasestorage.app",
  messagingSenderId: "1034985835970",
  appId: "1:1034985835970:web:1f1ee2b537a800ad55da5b",
  measurementId: "G-F8N686HBMH"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// // const analytics = getAnalytics(app);

// // export const auth=getAuth(app);

// export const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage),
// });

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };