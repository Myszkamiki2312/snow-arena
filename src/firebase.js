
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyCrKt30UtLpP76Q3C85-697vVPWkz8RlXA",
  authDomain: "snowarena.firebaseapp.com",
  projectId: "snowarena",
  storageBucket: "snowarena.firebasestorage.app",
  messagingSenderId: "110495883639",
  appId: "1:110495883639:web:9b6a40d4ed7affabd14172"
};


const app = initializeApp(firebaseConfig);


const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };