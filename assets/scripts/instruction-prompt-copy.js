const PROMPT_COPY_STYLE_ID = "instruction-prompt-copy-style";

export function setupInstructionPromptCopy({
  buttonSelector = "#instruction-copy-prompt",
  feedbackSelector = "#instruction-copy-feedback",
  promptSelector = '[data-field="agent-prompt"]',
  onCopySuccess = null,
} = {}) {
  const button = document.querySelector(buttonSelector);
  const feedback = document.querySelector(feedbackSelector);
  const promptNode = document.querySelector(promptSelector);

  if (!button || !feedback || !promptNode) {
    return {
      clearPromptCopyFeedback() {},
    };
  }

  ensurePromptCopyStyles();

  const setPromptCopyFeedback = (message) => {
    feedback.textContent = message;
  };

  const clearPromptCopyFeedback = () => {
    setPromptCopyFeedback("");
  };

  button.addEventListener("click", async () => {
    const promptText = promptNode.textContent?.trim();

    if (!promptText) {
      setPromptCopyFeedback("Prompt unavailable.");
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(promptText);
      setPromptCopyFeedback("Prompt copied. Paste it directly into the plugin input box.");
      if (typeof onCopySuccess === "function") {
        onCopySuccess();
      }
    } catch (_error) {
      setPromptCopyFeedback("Copy failed. Please select the prompt manually.");
    }
  });

  return {
    clearPromptCopyFeedback,
  };
}

function ensurePromptCopyStyles() {
  if (document.getElementById(PROMPT_COPY_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = PROMPT_COPY_STYLE_ID;
  style.textContent = `
    .instruction-prompt-toolbar {
      position: absolute;
      top: 14px;
      right: 16px;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      margin: 0;
    }

    .instruction-prompt-copy-button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
      min-width: 148px;
      min-height: 34px;
      padding: 0 11px;
      border: 1px solid #d5deea;
      border-radius: 999px;
      background: #ffffff;
      color: #243041;
      font: inherit;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 120ms ease, border-color 120ms ease, transform 120ms ease;
    }

    .instruction-prompt-copy-button:hover {
      border-color: #b8c8da;
      background: #f7fbff;
      transform: translateY(-1px);
    }

    .instruction-prompt-copy-button svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    .prompt-card {
      position: relative;
      overflow: visible;
    }

    .instruction-prompt-toolbar + pre {
      padding-right: 188px;
      overflow: visible;
      max-height: none;
    }

    .instruction-prompt-copy-feedback {
      min-height: 20px;
      margin: -6px 0 14px;
      color: #0b6dca;
      font-size: 0.84rem;
    }

    @media (max-width: 720px) {
      .instruction-prompt-toolbar {
        position: static;
        margin-bottom: 10px;
      }

      .instruction-prompt-copy-button {
        width: 100%;
        justify-content: center;
      }

      .instruction-prompt-toolbar + pre {
        padding-right: 0;
      }
    }
  `;
  document.head.append(style);
}
