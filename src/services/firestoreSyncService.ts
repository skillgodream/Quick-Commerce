import {
  collection,
  onSnapshot,
  getDocs,
  query,
  limit,
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { SimulatorEvidenceItem, parseCanonicalEvidence } from "./simulatorEvidenceService";

const COLLECTION_NAME = "simulator_evidence";

/**
 * Subscribes to real-time updates from the shared simulator_evidence collection
 */
export function subscribeToFirestoreEvidence(
  callback: (evidenceList: SimulatorEvidenceItem[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, limit(1000));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: SimulatorEvidenceItem[] = [];
        snapshot.forEach((docSnap) => {
          const raw = docSnap.data();
          const parsed = parseCanonicalEvidence({
            evidence_id: docSnap.id,
            ...raw,
          });
          if (parsed) {
            items.push(parsed);
          }
        });
        callback(items);
      },
      (error) => {
        console.warn("[Firestore Real-Time Sync Warning]:", error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Failed to initialize Firestore listener:", err);
    return () => {};
  }
}

/**
 * One-time fetch of all evidence records currently in Firestore
 */
export async function fetchEvidenceFromFirestore(): Promise<SimulatorEvidenceItem[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(query(colRef, limit(1000)));
    const items: SimulatorEvidenceItem[] = [];
    snapshot.forEach((docSnap) => {
      const raw = docSnap.data();
      const parsed = parseCanonicalEvidence({
        evidence_id: docSnap.id,
        ...raw,
      });
      if (parsed) {
        items.push(parsed);
      }
    });
    return items;
  } catch (err) {
    console.warn("Error fetching evidence from Firestore:", err);
    return [];
  }
}

/**
 * Pushes evidence items to the shared Firestore collection
 */
export async function pushEvidenceToFirestore(items: any[]): Promise<number> {
  try {
    let successCount = 0;
    for (const item of items) {
      const docId = item.evidence_id || item.id || `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await setDoc(doc(db, COLLECTION_NAME, docId), {
        ...item,
        updated_at: new Date().toISOString(),
      }, { merge: true });
      successCount++;
    }
    return successCount;
  } catch (err) {
    console.error("Failed to push evidence to Firestore:", err);
    throw err;
  }
}
