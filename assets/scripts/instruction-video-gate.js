const VIDEO_GATE_STYLE_ID = "instruction-video-gate-style";

export function setupInstructionVideoGate({
  instructionModal,
  tutorialFrame,
  nextButton,
  storageKey,
  message = "Watch the full tutorial video before continuing.",
}) {
  if (!instructionModal || !tutorialFrame || !nextButton) {
    return {
      sync() {},
    };
  }

  ensureVideoGateStyles();

  const note = document.createElement("p");
  note.className = "instruction-video-gate-note";
  note.hidden = true;

  const actions = instructionModal.querySelector(".instruction-actions");
  if (actions) {
    actions.before(note);
  } else {
    instructionModal.append(note);
  }

  let isUnlocked = readStoredState(storageKey);
  let cleanupVideoListeners = null;

  const markComplete = () => {
    if (isUnlocked) {
      return;
    }

    isUnlocked = true;
    try {
      window.sessionStorage.setItem(storageKey, "watched");
    } catch {
      // Ignore storage failures in restricted browsing environments.
    }
    sync();
  };

  const bindVideo = () => {
    if (typeof cleanupVideoListeners === "function") {
      cleanupVideoListeners();
      cleanupVideoListeners = null;
    }

    const video = tutorialFrame.querySelector("video");
    if (!video || isUnlocked) {
      sync();
      return;
    }

    let furthestTime = 0;

    const handleTimeUpdate = () => {
      furthestTime = Math.max(furthestTime, video.currentTime || 0);
    };

    const handleSeeking = () => {
      if (video.ended) {
        return;
      }

      const allowedTime = furthestTime + 1;
      if (video.currentTime > allowedTime) {
        video.currentTime = furthestTime;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("ended", markComplete, { once: true });

    cleanupVideoListeners = () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("ended", markComplete);
    };

    sync();
  };

  const sync = () => {
    const video = tutorialFrame.querySelector("video");
    const shouldLock = Boolean(video) && !isUnlocked;
    nextButton.disabled = shouldLock;
    note.hidden = !shouldLock;
    note.textContent = shouldLock ? message : "";
  };

  bindVideo();

  return {
    sync() {
      bindVideo();
      sync();
    },
  };
}

function readStoredState(storageKey) {
  if (!storageKey) {
    return false;
  }

  try {
    return window.sessionStorage.getItem(storageKey) === "watched";
  } catch {
    return false;
  }
}

function ensureVideoGateStyles() {
  if (document.getElementById(VIDEO_GATE_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = VIDEO_GATE_STYLE_ID;
  style.textContent = `
    .instruction-video-gate-note {
      margin: 14px 0 0;
      text-align: center;
      color: #b42318;
      font-size: 0.92rem;
      font-weight: 700;
      line-height: 1.5;
    }
  `;
  document.head.append(style);
}
