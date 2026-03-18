import { saveInteractionLog } from "./firebase-client.js";

const interactionLogs = [];

const latestInputValues = new Map();

/**
 * Flushes latest input values into the interaction logs array.
 */
export function flushFinalInputs() {
  for (const logEntry of latestInputValues.values()) {
    interactionLogs.push(logEntry);
  }
  latestInputValues.clear();
}

/**
 * Returns a copy of the accumulated interaction logs.
 */
export function getInteractionLogs() {
  flushFinalInputs();
  return [...interactionLogs];
}

/**
 * Clears logs
 */
export function clearInteractionLogs() {
  interactionLogs.length = 0;
  latestInputValues.clear();
}

function initInteractionLogger() {
  const params = new URLSearchParams(window.location.search);
  const pid = params.get("pid")?.trim();
  const step = Number.parseInt(params.get("step") ?? "0", 10);

  const pathParts = window.location.pathname.split("/");
  const pageId = pathParts.find(part => part.startsWith("page-")) || "unknown";

  /**
   * click logging
   */
  const logClick = (event) => {
    const target = event.target;

    // Ignore events originating from the survey modal or instruction modal
    if (
      target.closest("#survey-modal") || 
      target.closest("#instruction-modal")
    ) {
      return;
    }

    if (
      target.tagName === "BUTTON" ||
      target.tagName === "A" ||
      target.closest("button") ||
      target.closest("a")
    ) {
      const logEntry = {
        pid,
        step,
        pageId,
        type: "click",
        target: JSON.stringify({
          tagName: target.tagName,
          id: target.id,
          className: target.className,
          text: target.innerText?.substring(0, 100),
        }),
        metadata: {
          url: window.location.href,
          timestamp: Date.now(),
        },
      };

      interactionLogs.push(logEntry);
      // saveInteractionLog(logEntry);
    }
  };

  const handleChange = (event) => {
    const target = event.target;

    // Ignore events originating from the survey modal or instruction modal
    if (
      target.closest("#survey-modal") || 
      target.closest("#instruction-modal")
    ) {
      return;
    }

    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT"
    ) {
      const key = `${pageId}-${target.name || target.id || target.placeholder}`;

      latestInputValues.set(key, {
        pid,
        step,
        pageId,
        type: "final_input",
        target: JSON.stringify({
          tagName: target.tagName,
          id: target.id,
          name: target.name,
          placeholder: target.placeholder,
        }),
        value: target.value,
        metadata: {
          url: window.location.href,
          timestamp: Date.now(),
        },
      });
    }
  };

  document.addEventListener("click", logClick, true);
  document.addEventListener("change", handleChange, true);

  window.addEventListener("beforeunload", flushFinalInputs);
}

// Start logger
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initInteractionLogger);
} else {
  initInteractionLogger();
}