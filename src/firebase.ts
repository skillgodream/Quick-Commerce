import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Target Database configured from SkillGo Club Simulator
export const firebaseConfig = {
  projectId: "ai-studio-organizationsimu-69feac0c-7d69-45d3-93fa-c069f1001ea5",
  appId: "1:891743969591:web:simulator-sync-client",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
