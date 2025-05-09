// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAADzO9Kdm_JqxKsDBPRKCFQaBq6Dq266g",
  authDomain: "poppppsss.firebaseapp.com",
  projectId: "poppppsss",
  storageBucket: "poppppsss.firebasestorage.app",
  messagingSenderId: "308896903322",
  appId: "1:308896903322:web:ab76355b0473abcd526f23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
