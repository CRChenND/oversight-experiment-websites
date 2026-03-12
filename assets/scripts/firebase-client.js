import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAnalytics, isSupported as isAnalyticsSupported } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
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

export async function saveQuestionnaireResponse({ pid, step, questionnaire, responses }) {
  if (!pid) {
    throw new Error("Missing pid. Questionnaire responses cannot be saved.");
  }

  const user = await ensureAnonymousAuth();
  const participantRef = doc(db, "participants", pid);
  const stepKey = Number.isInteger(step) && step > 0 ? `step_${step}` : null;
  const basePayload = {
    pid,
    ownerUid: user.uid,
    updatedAt: serverTimestamp(),
  };

  let payload;
  if (questionnaire === "demographics") {
    payload = {
      ...basePayload,
      demographics: {
        responses,
        submittedAt: serverTimestamp(),
      },
    };
  } else if (questionnaire === "tlx" && stepKey) {
    payload = {
      ...basePayload,
      steps: {
        [stepKey]: {
          tlx: {
            responses,
            submittedAt: serverTimestamp(),
          },
        },
      },
    };
  } else {
    throw new Error("Missing step number for TLX response.");
  }

  await setDoc(participantRef, payload, { merge: true });
}
