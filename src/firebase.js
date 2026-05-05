import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your actual Firebase project configuration
// You can get this from the Firebase Console > Project Settings > General > Your Apps
const firebaseConfig = {
  apiKey: "AIzaSyDgEeHXXSObvWecshkBjFFaQGEBneZOwHs",
  authDomain: "face-attendance-system-cbded.firebaseapp.com",
  projectId: "face-attendance-system-cbded",
  storageBucket: "face-attendance-system-cbded.firebasestorage.app",
  messagingSenderId: "31453351531",
  appId: "1:31453351531:web:a9c6a92267fa21e3acab2e"
};

let app;
let auth;
let db;

try {
    // Check if config is set (simple check)
    if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
        console.warn("Firebase config is missing! Please update src/firebase.js");
    } else {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase initialized successfully");
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";
export { auth, db };
export default app;
