import { saveInteractionLog } from "./firebase-client.js";

const interactionLogs = [];

const latestInputValues = new Map();

function formatHumanReadableTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(date);
}

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

  const getLoggableElement = (target) => {
    if (!(target instanceof Element)) {
      return null;
    }

    return target.closest("button, a, [role='button']");
  };

  const getElementText = (element) =>
    element?.innerText
      ?.replace(/\s+/g, " ")
      .trim()
      .substring(0, 100) || "";

  /**
   * click logging
   */
  const logClick = (event) => {
    const target = event.target;
    const element = getLoggableElement(target);

    // Ignore events originating from the survey modal or instruction modal
    if (
      (target instanceof Element && target.closest("#survey-modal")) ||
      (target instanceof Element && target.closest("#instruction-modal"))
    ) {
      return;
    }

    if (element) {
      const logEntry = {
        pid,
        step,
        pageId,
        type: "click",
        target: JSON.stringify({
          tagName: element.tagName,
          id: element.id,
          className: element.className,
          text: getElementText(element),
          ariaLabel: element.getAttribute("aria-label") || "",
          href: element instanceof HTMLAnchorElement ? element.href : "",
          originalTargetTagName: target instanceof Element ? target.tagName : "",
        }),
        metadata: {
          url: window.location.href,
          timestamp: formatHumanReadableTimestamp(),
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
          timestamp: formatHumanReadableTimestamp(),
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
