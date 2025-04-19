import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJtiPC78relw3dFsLNzN91gcfwvFu8qvY",
  authDomain: "empowher-be4e7.firebaseapp.com",
  projectId: "empowher-be4e7",
  storageBucket: "empowher-be4e7.firebasestorage.app",
  messagingSenderId: "395101043949",
  appId: "1:395101043949:web:00dff7996910105ef420e4",
  measurementId: "G-GF58RQH2K7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services for use in other parts of your app
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const firestore = getFirestore(app);
export const storage = getStorage(app);

export default app;
