import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD7he1t-eLRUPOjUvbSfImIBLhKelaoQbw",
  authDomain: "cesium-building-creator.firebaseapp.com",
  projectId: "cesium-building-creator",
  storageBucket: "cesium-building-creator.appspot.com",
  messagingSenderId: "969094865431",
  appId: "1:969094865431:web:4f6b4b7324c4a3ca0a1b9c"
};

let app;
let db;

export const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return { app, db };
};

export const saveBuildingData = async (buildingId, data) => {
  if (!db) initializeFirebase();
  await setDoc(doc(db, "buildings", buildingId), data);
};

export const getBuildingData = async (buildingId) => {
  if (!db) initializeFirebase();
  const docRef = doc(db, "buildings", buildingId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};