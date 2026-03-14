const PERSONA_FIELDS = [
  ["Full name", "John Davis"],
  ["Date of birth", "06/20/1990"],
  ["Social Security Number", "123-45-6789"],
  ["Phone number", "(213) 555-0198"],
  ["Email", "john.davis87273@gmail.com"],
  ["Address", "123 Main Street, Los Angeles, CA"],
  ["Zipcode", "90001"],
  ["Health insurance policy number", "UHC-CA-2298-7781"],
  ["Credit card number", "4635787633522289"],
  ["CVV", "123"],
  ["Credit card expiration date", "01/2036"],
  ["Credit score", "720"],
];
const PERSONA_STYLE_ID = "instruction-persona-compact-style";

export function ensureInstructionPersonaBlock(taskCopy) {
  if (!taskCopy) {
    return;
  }

  ensurePersonaStyles();

  let block = taskCopy.querySelector('[data-persona-block="true"]');
  if (!block) {
    block = document.createElement("div");
    block.className = "task-card persona-card";
    block.dataset.personaBlock = "true";
    block.innerHTML = `
      <p class="task-card-label">Assigned Persona</p>
      <p class="persona-intro">
        Use the following user information for this task.
      </p>
      <div class="persona-grid"></div>
    `;
    const firstTaskCard = taskCopy.querySelector(".task-card");
    if (firstTaskCard) {
      firstTaskCard.insertAdjacentElement("beforebegin", block);
    } else {
      taskCopy.append(block);
    }
  }

  const grid = block.querySelector(".persona-grid");
  if (!grid) {
    return;
  }

  grid.replaceChildren(
    ...PERSONA_FIELDS.map(([label, value]) => {
      const row = document.createElement("div");
      row.className = "persona-line";
      row.innerHTML = `<strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span>`;
      return row;
    }),
  );
}

function ensurePersonaStyles() {
  if (document.getElementById(PERSONA_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = PERSONA_STYLE_ID;
  style.textContent = `
    .persona-card {
      margin-top: 12px;
    }

    .persona-intro {
      margin: 0 0 10px;
      color: #425466;
      line-height: 1.45;
      font-size: 0.9rem;
    }

    .persona-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .persona-line {
      display: grid;
      gap: 3px;
      margin: 0;
      padding: 10px 12px;
      border: 1px solid #dbe5f0;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.72);
    }

    .persona-line:first-child {
      padding-top: 10px;
      border-top: 1px solid #dbe5f0;
    }

    .persona-line strong {
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #0b6dca;
    }

    .persona-line span {
      color: #243041;
      line-height: 1.35;
      word-break: break-word;
    }

    @media (max-width: 720px) {
      .persona-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.append(style);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
