import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyDEoNIlT9etpi-3pAPNtlmUoNtLxP98fLA",
  authDomain: "plate-pulse-69281.firebaseapp.com",
  projectId: "plate-pulse-69281",
  storageBucket: "plate-pulse-69281.firebasestorage.app",
  messagingSenderId: "491907696238",
  appId: "1:491907696238:web:d3dc14b8c6245003ab087f",
  measurementId: "G-3YMVT47KCB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;
