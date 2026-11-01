import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDNrCaaeS342nfKdnHS2Y_b482v2E4Pg44",
  authDomain: "guidelanka-780e0.firebaseapp.com",
  projectId: "guidelanka-780e0",
  storageBucket: "guidelanka-780e0.firebasestorage.app",
  messagingSenderId: "911179176998",
  appId: "1:911179176998:web:c27e22c10b6a0580355ae7",
  measurementId: "G-4980173XS3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
