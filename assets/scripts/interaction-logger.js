import { saveInteractionLog } from "./firebase-client.js";

function initInteractionLogger() {
  const params = new URLSearchParams(window.location.search);
  const pid = params.get("pid")?.trim();
  const step = Number.parseInt(params.get("step") ?? "0", 10);
  
  // Extract pageId from path (e.g., /pages/page-1/ -> page-1)
  const pathParts = window.location.pathname.split("/");
  const pageId = pathParts.find(part => part.startsWith("page-")) || "unknown";

  const log = (type, event) => {
    const target = event.target;
    const targetInfo = {
      tagName: target.tagName,
      id: target.id,
      className: target.className,
      name: target.name,
      type: target.type,
      text: target.innerText?.substring(0, 100),
      placeholder: target.placeholder,
      value: (type === "input" || type === "change") ? target.value : undefined,
    };

    saveInteractionLog({
      pid,
      step,
      pageId,
      type,
      target: JSON.stringify(targetInfo),
      value: target.value,
      metadata: {
        url: window.location.href,
        timestamp: Date.now(),
      }
    });
  };

  document.addEventListener("click", (event) => {
    // Only log clicks on interactive elements or if it's a significant click
    const target = event.target;
    if (
      target.tagName === "BUTTON" || 
      target.tagName === "A" || 
      target.tagName === "INPUT" || 
      target.closest("button") || 
      target.closest("a")
    ) {
      log("click", event);
    }
  }, true);

  document.addEventListener("input", (event) => {
    // For inputs, we might want to debounce if it's too frequent, 
    // but the requirement is "input" and "input change".
    // Let's log 'input' for text entry and 'change' for final value.
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA" || event.target.tagName === "SELECT") {
      log("input", event);
    }
  }, true);

  document.addEventListener("change", (event) => {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA" || event.target.tagName === "SELECT") {
      log("change", event);
    }
  }, true);
}

// Start logger
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initInteractionLogger);
} else {
  initInteractionLogger();
}
