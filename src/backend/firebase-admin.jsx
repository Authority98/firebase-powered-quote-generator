import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCauP3movcN-kmF9RzKD0loA1Ea_k5M9qU",
  authDomain: "backend-for-quote-builder-app.firebaseapp.com",
  projectId: "backend-for-quote-builder-app",
  storageBucket: "backend-for-quote-builder-app.appspot.com",
  messagingSenderId: "502242232904",
  appId: "1:502242232904:web:9174be34fc77f831a8267d",
  measurementId: "G-9VZD97RBLF"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };