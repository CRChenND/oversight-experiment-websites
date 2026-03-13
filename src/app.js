import { INSTRUCTION_LIBRARY, PAGE_LIBRARY } from "./content.js";

const TOTAL_STEPS = 6;
const CONFIG_PATH = "./data/experiment-config.csv";
const app = document.querySelector("#app");

init().catch((error) => {
  renderError(`Failed to initialize the experiment: ${error.message}`);
});

async function init() {
  const configRows = await loadConfigRows(CONFIG_PATH);
  const params = new URLSearchParams(window.location.search);
  const pid = params.get("pid")?.trim();
  const stepValue = Number.parseInt(params.get("step") ?? "0", 10);

  if (!pid) {
    renderPidEntry();
    return;
  }

  const row = configRows.find((item) => item.pid === pid);
  if (!row) {
    renderError(
      `No configuration found for pid "${escapeHtml(pid)}". Add that pid to ${CONFIG_PATH} first.`,
    );
    return;
  }

  const sequence = buildSequence(row);
  if (stepValue <= 0) {
    renderLanding(pid, sequence);
    return;
  }

  if (stepValue > TOTAL_STEPS) {
    renderComplete(pid, sequence);
    return;
  }

  renderStep(pid, sequence, stepValue);
}

function renderPidEntry() {
  app.innerHTML = `
    <div class="stack">
      <div class="card">
        <p class="label">Start Experiment</p>
        <h2>Enter a participant ID</h2>
        <p class="helper">
          You can also open this page directly with <code>?pid=P001</code>.
        </p>
      </div>
      <form id="pid-form" class="card stack">
        <label for="pid-input">Participant ID</label>
        <input id="pid-input" name="pid" type="text" placeholder="Example: P001" required />
        <div class="actions">
          <button class="primary" type="submit">Load Flow</button>
        </div>
      </form>
    </div>
  `;

  document.querySelector("#pid-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const pid = String(formData.get("pid") ?? "").trim();
    if (!pid) return;
    window.location.search = new URLSearchParams({ pid }).toString();
  });
}

function renderLanding(pid, sequence) {
  const items = sequence
    .map(
      (item, index) => `
        <li>
          <strong>Step ${index + 1}.</strong> ${escapeHtml(item.page.title)}<br />
          <span class="helper">${escapeHtml(item.instruction.title)}: ${escapeHtml(item.instruction.body)}</span>
        </li>
      `,
    )
    .join("");

  app.innerHTML = `
    <div class="stack">
      <div class="card">
        <p class="label">Participant</p>
        <h2>${escapeHtml(pid)}</h2>
        <p class="helper">
          The sequence below is fully determined by the CSV configuration for this pid. All
          participants first complete the shared page-0 warm-up before entering step 1.
        </p>
      </div>
      <div class="card">
        <p class="label">Resolved Sequence</p>
        <ol class="sequence-list">${items}</ol>
      </div>
      <div class="actions">
        <a class="button-link primary" href="./pages/page-0/?pid=${encodeURIComponent(pid)}&step=0">Start Tutorial</a>
      </div>
    </div>
  `;
}

function renderStep(pid, sequence, stepNumber) {
  const current = sequence[stepNumber - 1];
  const nextHref = stepNumber === TOTAL_STEPS ? buildUrl(pid, TOTAL_STEPS + 1) : buildUrl(pid, stepNumber + 1);
  const nextLabel = stepNumber === TOTAL_STEPS ? "Finish Experiment" : "Next Step";

  app.innerHTML = `
    <div class="stack">
      <div class="meta">
        <span class="pill">Participant: ${escapeHtml(pid)}</span>
        <span class="pill">Step ${stepNumber} / ${TOTAL_STEPS}</span>
        <span class="pill">Page ID: ${escapeHtml(current.pageId)}</span>
        <span class="pill">Instruction ID: ${escapeHtml(current.instructionId)}</span>
      </div>

      <div class="card instruction">
        <p class="label">Initial Instruction</p>
        <h2>${escapeHtml(current.instruction.title)}</h2>
        <p>${escapeHtml(current.instruction.body)}</p>
      </div>

      <div class="task-frame stack">
        <div>
          <p class="label">Task Page</p>
          <h2>${escapeHtml(current.page.title)}</h2>
          <p class="helper">${escapeHtml(current.page.summary)}</p>
        </div>

        <div class="card">
          <p class="label">Participant Prompt</p>
          <p>${escapeHtml(current.page.prompt)}</p>
        </div>
      </div>

      <div class="actions">
        ${
          stepNumber > 1
            ? `<a class="button-link secondary" href="${buildUrl(pid, stepNumber - 1)}">Previous Step</a>`
            : `<a class="button-link secondary" href="${buildUrl(pid)}">Back to Overview</a>`
        }
        <a class="button-link primary" href="${nextHref}">${nextLabel}</a>
      </div>
    </div>
  `;
}

function renderComplete(pid, sequence) {
  app.innerHTML = `
    <div class="stack">
      <div class="card">
        <p class="label">Completed</p>
        <h2>Experiment Finished</h2>
        <p class="helper">
          Participant <code>${escapeHtml(pid)}</code> completed ${sequence.length} configured steps.
        </p>
      </div>
      <div class="actions">
        <a class="button-link secondary" href="${buildUrl(pid)}">Review Sequence</a>
        <a class="button-link primary" href="./">Load Another PID</a>
      </div>
    </div>
  `;
}

function renderError(message) {
  app.innerHTML = `
    <div class="stack">
      <div class="card">
        <p class="label">Configuration Error</p>
        <h2>Unable to resolve experiment flow</h2>
        <p class="error">${message}</p>
      </div>
      <div class="actions">
        <a class="button-link secondary" href="./">Back to Start</a>
      </div>
    </div>
  `;
}

function buildSequence(row) {
  return Array.from({ length: TOTAL_STEPS }, (_, index) => {
    const pageId = row[`step_${index + 1}_page`];
    const instructionId = row[`step_${index + 1}_instruction`];
    const page = PAGE_LIBRARY[pageId];
    const instruction = INSTRUCTION_LIBRARY[instructionId];

    if (!page) {
      throw new Error(`Unknown page id "${pageId}" in step ${index + 1}.`);
    }

    if (!instruction) {
      throw new Error(`Unknown instruction id "${instructionId}" in step ${index + 1}.`);
    }

    return { pageId, instructionId, page, instruction };
  });
}

function buildUrl(pid, step) {
  const params = new URLSearchParams({ pid });
  if (step) {
    params.set("step", String(step));
  }
  return `./?${params.toString()}`;
}

async function loadConfigRows(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${path}.`);
  }

  const text = await response.text();
  return parseCsv(text);
}

function parseCsv(text) {
  const rows = [];
  const records = [];
  let currentField = "";
  let currentRow = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      currentRow.push(currentField.trim());
      currentField = "";
      if (currentRow.some((field) => field.length > 0)) {
        records.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      records.push(currentRow);
    }
  }

  const [header = [], ...dataRows] = records;
  for (const dataRow of dataRows) {
    const rowObject = {};
    header.forEach((key, index) => {
      rowObject[key] = dataRow[index] ?? "";
    });
    rows.push(rowObject);
  }

  return rows;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
