import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAnalytics, isSupported as isAnalyticsSupported } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfouMm0z-a17Onve4AnpWRFaRcQ2IBghA",
  authDomain: "agent-oversight.firebaseapp.com",
  projectId: "agent-oversight",
  storageBucket: "agent-oversight.firebasestorage.app",
  messagingSenderId: "275186737666",
  appId: "1:275186737666:web:2e24b7fb860115834cfd1b",
  measurementId: "G-TSFG87RQ7T",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let authReadyPromise = null;

void isAnalyticsSupported()
  .then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  })
  .catch(() => {
    // Ignore analytics startup failures in unsupported environments.
  });

async function ensureAnonymousAuth() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          if (user) {
            unsubscribe();
            resolve(user);
            return;
          }

          try {
            const credential = await signInAnonymously(auth);
            unsubscribe();
            resolve(credential.user);
          } catch (error) {
            unsubscribe();
            reject(error);
          }
        },
        reject,
      );
    }).finally(() => {
      authReadyPromise = null;
    });
  }

  return authReadyPromise;
}

export async function saveInteractionLog({ pid, step, pageId, type, target, value, metadata }) {
  if (!pid) {
    return;
  }

  const interactionsRef = collection(db, "participants", pid, "interactions");
  const payload = {
    step,
    pageId,
    type,
    target,
    value: value ?? null,
    metadata: metadata ?? {},
    timestamp: serverTimestamp(),
  };

  try {
    await addDoc(interactionsRef, payload);
  } catch (error) {
    const shouldRetryWithAuth =
      error?.code === "permission-denied" ||
      error?.code === "unauthenticated" ||
      error?.code === "failed-precondition";

    if (!shouldRetryWithAuth) {
      console.error("Failed to save interaction log:", error);
      return;
    }

    try {
      await ensureAnonymousAuth();
      await addDoc(interactionsRef, payload);
    } catch (retryError) {
      console.error("Failed to save interaction log after auth retry:", retryError);
    }
  }
}

export async function saveQuestionnaireResponse({ pid, step, questionnaire, responses, interactionLogs }) {
  if (!pid) {
    throw new Error("Missing pid. Questionnaire responses cannot be saved.");
  }

  const participantRef = doc(db, "participants", pid);
  const stepKey = Number.isInteger(step) && step > 0 ? `step_${step}` : null;
  const buildBasePayload = (ownerUid = null) => ({
    pid,
    ownerUid,
    updatedAt: serverTimestamp(),
  });

  const buildPayload = (ownerUid = null) => {
    const basePayload = buildBasePayload(ownerUid);

    if (questionnaire === "finalQuestionnaire") {
      return {
        ...basePayload,
        finalQuestionnaire: {
          responses,
          interactionLogs: interactionLogs ?? [],
          submittedAt: serverTimestamp(),
        },
      };
    }

    if (questionnaire === "postTaskSurvey" && stepKey) {
      return {
        ...basePayload,
        steps: {
          [stepKey]: {
            postTaskSurvey: {
              responses,
              submittedAt: serverTimestamp(),
            },
            interactionLogs: interactionLogs ?? [],
          },
        },
      };
    }

    throw new Error(`Unsupported questionnaire payload: ${questionnaire}`);
  };

  try {
    await setDoc(participantRef, buildPayload(auth.currentUser?.uid ?? null), { merge: true });
    return;
  } catch (error) {
    const shouldRetryWithAuth =
      error?.code === "permission-denied" ||
      error?.code === "unauthenticated" ||
      error?.code === "failed-precondition";

    if (!shouldRetryWithAuth) {
      throw error;
    }
  }

  const user = await ensureAnonymousAuth();
  await setDoc(
    participantRef,
    buildPayload(user.uid),
    { merge: true },
  );
}
