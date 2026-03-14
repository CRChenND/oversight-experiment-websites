const PERSONA_FIELDS = [
  ["Full name", "John Davis"],
  ["Date of birth", "06/20/1990"],
  ["Social Security Number", "123-45-6789"],
  ["Phone number", "(213) 555-0198"],
  ["Email", "john.davis87273@gmail.com"],
  ["Address", "123 Main Street, Los Angeles, CA"],
  ["Health insurance policy number", "UHC-CA-2298-7781"],
  ["Credit card number", "4635787633522289"],
  ["CVV", "123"],
  ["Credit card expiration date", "01/2036"],
  ["Credit score", "720"],
];

export function ensureInstructionPersonaBlock(taskCopy) {
  if (!taskCopy) {
    return;
  }

  let block = taskCopy.querySelector('[data-persona-block="true"]');
  if (!block) {
    block = document.createElement("div");
    block.className = "task-card persona-card";
    block.dataset.personaBlock = "true";
    block.innerHTML = `
      <p class="task-card-label">Assigned Persona</p>
      <p class="persona-intro">
        For this task, you should act as the following user. The web agent should also use this
        persona's information while completing the task.
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
      const row = document.createElement("p");
      row.className = "persona-line";
      row.innerHTML = `<strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span>`;
      return row;
    }),
  );
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
