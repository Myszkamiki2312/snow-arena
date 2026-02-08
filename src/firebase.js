
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCrKt30UtLpP76Q3C85-697vVPWkz8RlXA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "snowarena.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "snowarena",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "snowarena.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "110495883639",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:110495883639:web:9b6a40d4ed7affabd14172"
};


const app = initializeApp(firebaseConfig);


const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
