import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDghu7eHm5U_oFkKDnhj1THHEKJknM-Ktg",
  authDomain: "pathwayzapp.firebaseapp.com",
  projectId: "pathwayzapp",
  storageBucket: "pathwayzapp.firebasestorage.app",
  messagingSenderId: "1028132953000",
  appId: "1:1028132953000:web:55f4435ffd487538ca1b9d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;