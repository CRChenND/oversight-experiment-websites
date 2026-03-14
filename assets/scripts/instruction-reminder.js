const REMINDER_STYLE_ID = "instruction-reminder-style";

export function setupInstructionReminder({
  instructionModal,
  startButton,
  syncBodyScroll,
  label = "Task Instruction",
}) {
  if (!instructionModal || !startButton || typeof syncBodyScroll !== "function" || !document.body) {
    return {
      openInstructionModal() {},
      closeInstructionModal() {},
    };
  }

  ensureReminderStyles();

  const reminderButton = document.createElement("button");
  reminderButton.type = "button";
  reminderButton.className = "instruction-reminder-button";
  reminderButton.hidden = true;
  reminderButton.setAttribute("aria-label", label);
  reminderButton.innerHTML = `
    <span class="instruction-reminder-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M6 4.75A2.75 2.75 0 0 1 8.75 2h6.5A2.75 2.75 0 0 1 18 4.75v11.5A2.75 2.75 0 0 1 15.25 19h-6.5A2.75 2.75 0 0 1 6 16.25Z"></path>
        <path d="M9 7.5h6M9 11.25h6M9 15h3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"></path>
      </svg>
    </span>
    <span class="instruction-reminder-text">${label}</span>
  `;
  document.body.append(reminderButton);

  const openInstructionModal = () => {
    reminderButton.hidden = true;
    instructionModal.hidden = false;
    syncBodyScroll();
  };

  const closeInstructionModal = () => {
    instructionModal.hidden = true;
    reminderButton.hidden = false;
    syncBodyScroll();
  };

  startButton.addEventListener("click", closeInstructionModal);
  reminderButton.addEventListener("click", openInstructionModal);

  return {
    openInstructionModal,
    closeInstructionModal,
  };
}

function ensureReminderStyles() {
  if (document.getElementById(REMINDER_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = REMINDER_STYLE_ID;
  style.textContent = `
    .instruction-reminder-button {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 980;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-height: 52px;
      max-width: min(220px, calc(100vw - 32px));
      padding: 10px 14px 10px 12px;
      border: 1px solid rgba(11, 109, 202, 0.18);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.94);
      color: #16324f;
      box-shadow: 0 14px 32px rgba(8, 22, 44, 0.18);
      backdrop-filter: blur(12px);
      font: inherit;
      cursor: pointer;
      transition: transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
    }

    .instruction-reminder-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 18px 36px rgba(8, 22, 44, 0.22);
      background: rgba(255, 255, 255, 0.98);
    }

    .instruction-reminder-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0b6dca 0%, #0fa0db 100%);
      color: #ffffff;
      flex-shrink: 0;
    }

    .instruction-reminder-icon svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    .instruction-reminder-text {
      font-size: 0.84rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-align: left;
      line-height: 1.15;
    }

    @media (max-width: 680px) {
      .instruction-reminder-button {
        right: 12px;
        bottom: 12px;
        padding-right: 12px;
      }

      .instruction-reminder-text {
        font-size: 0.78rem;
      }
    }
  `;
  document.head.append(style);
}
