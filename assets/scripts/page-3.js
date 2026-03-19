import { setupQuestionnaireModal } from "./questionnaire-modal.js";
import { ensureInstructionPersonaBlock } from "./instruction-persona.js";
import { setupInstructionReminder } from "./instruction-reminder.js";
import { setupInstructionPromptCopy } from "./instruction-prompt-copy.js";
import { setupInstructionVideoGate } from "./instruction-video-gate.js";

const formStepMount = document.querySelector("#form-step-mount");
const surveyModal = document.querySelector("#survey-modal");
const instructionModal = document.querySelector("#instruction-modal");
const instructionStepLabel = document.querySelector("#instruction-step-label");
const instructionTitle = document.querySelector("#instruction-title");
const tutorialBlock = document.querySelector("#tutorial-block");
const tutorialFrame = document.querySelector("#tutorial-frame");
const tutorialCopy = document.querySelector("#instruction-copy");
const taskCopy = document.querySelector("#instruction-task-copy");
const statusMessage = document.querySelector("#instruction-status");
const previousButton = document.querySelector("#instruction-prev");
const nextButton = document.querySelector("#instruction-next");
const startButton = document.querySelector("#instruction-start");
const progressDots = Array.from(document.querySelectorAll(".instruction-progress-dot"));
const EXPERIMENT_CONFIG_PATH = "../../data/experiment-config.csv";
const PAGE_CONTENT_PATH = "../../data/page-content.csv";
const CURRENT_PAGE_ID = "page-3";
const QUALTRICS_SURVEY_URL = "https://qualtrics.com/";
const MECHANISM_MAP = {
  R1: {
    name: "Risk Gated",
    tutorialVideo: "../../assets/video/risk_gated_oversight_tutorial_h264.mp4",
  },
  R2: {
    name: "Supervisory Co-Execution",
    tutorialVideo: "../../assets/video/supervisory_co_execution_oversight_tutorial_h264.mp4",
  },
  R3: {
    name: "Action Confirmation",
    tutorialVideo: "../../assets/video/action_confirmation_oversight_tutorial_h264.mp4",
  },
  R4: {
    name: "Structural Amplification",
    tutorialVideo: "../../assets/video/structural_amplification_oversight_tutorial_h264.mp4",
  },
};

let navigationContext = null;
let currentMechanismName = "Oversight";
let currentFormStep = 1;
const formState = {
  name: {
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "-Select One-",
    otherNames: "",
    status: "",
  },
  address: {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "California",
    zipCode: "",
    healthInsurancePolicyNumber: "",
    status: "",
  },
};
const questionnaireModal = setupQuestionnaireModal({
  getNavigationContext: () => navigationContext,
  onVisibilityChange: syncBodyScroll,
});

disableIndexNavigation();
setupFormSteps();
setupInstructionModal().catch((error) => {
  if (statusMessage && instructionModal) {
    instructionModal.hidden = false;
    syncBodyScroll();
    statusMessage.textContent = `Unable to load instruction config: ${error.message}`;
  }
});

function disableIndexNavigation() {
  document.querySelectorAll('a[href="../../"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
    });
  });
}

function setupFormSteps() {
  if (!formStepMount) {
    return;
  }

  renderFormStep();
}

function showFormStep(stepNumber) {
  currentFormStep = stepNumber;
  renderFormStep();
}

function renderFormStep() {
  if (!formStepMount) {
    return;
  }

  formStepMount.innerHTML = currentFormStep === 1 ? buildNameFormMarkup() : buildAddressFormMarkup();
  disableIndexNavigation();

  const activeForm = formStepMount.querySelector("form");
  if (!activeForm) {
    return;
  }

  if (currentFormStep === 1) {
    bindNameForm(activeForm);
    return;
  }

  bindAddressForm(activeForm);
}

function bindNameForm(form) {
  const firstNameInput = form.querySelector("#first-name");
  const middleNameInput = form.querySelector("#middle-name");
  const lastNameInput = form.querySelector("#last-name");
  const suffixInput = form.querySelector("#suffix");
  const otherNamesInput = form.querySelector("#other-names");
  const statusNode = form.querySelector("#name-form-status");

  if (
    !firstNameInput ||
    !middleNameInput ||
    !lastNameInput ||
    !suffixInput ||
    !otherNamesInput ||
    !statusNode
  ) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    syncNameFormState(form);

    if (!formState.name.firstName.trim() || !formState.name.lastName.trim()) {
      formState.name.status = "Enter both required name fields to continue.";
      statusNode.textContent = formState.name.status;
      return;
    }

    formState.name.status = "";
    showFormStep(2);
  });
}

function bindAddressForm(form) {
  const backButton = form.querySelector("#address-back-button");
  const statusNode = form.querySelector("#address-form-status");

  if (!backButton || !statusNode) {
    return;
  }

  backButton.addEventListener("click", () => {
    syncAddressFormState(form);
    formState.address.status = "";
    showFormStep(1);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    syncAddressFormState(form);

    const zipValue = formState.address.zipCode.trim();
    if (
      !formState.address.addressLine1.trim() ||
      !formState.address.city.trim() ||
      !zipValue
    ) {
      formState.address.status =
        "Enter the required address, city, and zip code to continue.";
      statusNode.textContent = formState.address.status;
      return;
    }

    if (!/^\d{5}$/.test(zipValue)) {
      formState.address.status = "Enter a valid 5-digit zip code.";
      statusNode.textContent = formState.address.status;
      return;
    }

    formState.address.status = "";
    openSurveyModal();
  });
}

function syncNameFormState(form) {
  const firstNameInput = form.querySelector("#first-name");
  const middleNameInput = form.querySelector("#middle-name");
  const lastNameInput = form.querySelector("#last-name");
  const suffixInput = form.querySelector("#suffix");
  const otherNamesInput = form.querySelector("#other-names");

  formState.name.firstName = firstNameInput?.value ?? "";
  formState.name.middleName = middleNameInput?.value ?? "";
  formState.name.lastName = lastNameInput?.value ?? "";
  formState.name.suffix = suffixInput?.value ?? "-Select One-";
  formState.name.otherNames = otherNamesInput?.value ?? "";
}

function syncAddressFormState(form) {
  const addressLine1Input = form.querySelector("#address-line-1");
  const addressLine2Input = form.querySelector("#address-line-2");
  const cityInput = form.querySelector("#city");
  const stateInput = form.querySelector("#state");
  const zipCodeInput = form.querySelector("#zip-code");
  const policyNumberInput = form.querySelector("#health-insurance-policy-number");

  formState.address.addressLine1 = addressLine1Input?.value ?? "";
  formState.address.addressLine2 = addressLine2Input?.value ?? "";
  formState.address.city = cityInput?.value ?? "";
  formState.address.state = stateInput?.value ?? "California";
  formState.address.zipCode = zipCodeInput?.value ?? "";
  formState.address.healthInsurancePolicyNumber = policyNumberInput?.value ?? "";
}

function buildNameFormMarkup() {
  return `
    <form class="form-step active" id="name-form" data-step-panel="1">
      <div class="step-intro">
        <h1>What's your name?</h1>
        <p>(Nice to meet you!)</p>
        <a class="info-banner" href="../../">Who should fill out this application?</a>
      </div>

      <label class="field">
        <span>First Name <strong>(required)</strong></span>
        <input id="first-name" type="text" value="${escapeHtml(formState.name.firstName)}" />
      </label>

      <label class="field">
        <span>Middle Name</span>
        <input id="middle-name" type="text" value="${escapeHtml(formState.name.middleName)}" />
      </label>

      <label class="field">
        <span>Last Name <strong>(required)</strong></span>
        <input id="last-name" type="text" value="${escapeHtml(formState.name.lastName)}" />
      </label>

      <label class="field">
        <span>Suffix</span>
        <select id="suffix">
          ${buildOptions(["-Select One-", "Jr.", "Sr.", "III"], formState.name.suffix)}
        </select>
      </label>

      <label class="field">
        <span>Other Names</span>
        <input id="other-names" type="text" value="${escapeHtml(formState.name.otherNames)}" />
        <small>Maiden, Nicknames, etc.</small>
      </label>

      <p class="form-status" id="name-form-status" aria-live="polite">${escapeHtml(formState.name.status)}</p>

      <div class="form-actions">
        <button class="nav-button back" type="button" disabled>&lt;</button>
        <button class="nav-button next" id="name-next-button" type="submit">Next</button>
      </div>
    </form>
  `;
}

function buildAddressFormMarkup() {
  return `
    <form class="form-step active" id="address-form" data-step-panel="2">
      <div class="step-intro compact">
        <h1>Where do you currently live?</h1>
      </div>

      <label class="field">
        <span>Address Line 1 <strong>(required)</strong></span>
        <input id="address-line-1" type="text" value="${escapeHtml(formState.address.addressLine1)}" />
      </label>

      <label class="field">
        <span>Address Line 2</span>
        <input id="address-line-2" type="text" value="${escapeHtml(formState.address.addressLine2)}" />
        <small>This could be an apartment, unit or dorm room number.</small>
      </label>

      <label class="field">
        <span>City <strong>(required)</strong></span>
        <input id="city" type="text" value="${escapeHtml(formState.address.city)}" />
      </label>

      <label class="field">
        <span>State</span>
        <select id="state">
          ${buildOptions(["California"], formState.address.state)}
        </select>
      </label>

      <label class="field">
        <span>Zip Code <strong>(required)</strong></span>
        <input
          id="zip-code"
          type="text"
          inputmode="numeric"
          value="${escapeHtml(formState.address.zipCode)}"
        />
      </label>

      <label class="field">
        <span>Health Insurance Policy Number</span>
        <input
          id="health-insurance-policy-number"
          type="text"
          value="${escapeHtml(formState.address.healthInsurancePolicyNumber)}"
        />
        <small>
          BenefitsCal may use this to help verify your current coverage and determine which
          health benefit programs or follow-up documents may apply to your application.
        </small>
      </label>

      <p class="form-status" id="address-form-status" aria-live="polite">${escapeHtml(formState.address.status)}</p>

      <div class="form-actions">
        <button class="nav-button back" id="address-back-button" type="button">&lt;</button>
        <button class="nav-button next" type="submit">submit</button>
      </div>
    </form>
  `;
}

function buildOptions(options, selectedValue) {
  return options
    .map((option) => {
      const selected = option === selectedValue ? ' selected' : "";
      return `<option${selected}>${escapeHtml(option)}</option>`;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function setupInstructionModal() {
  if (
    !instructionModal ||
    !instructionStepLabel ||
    !instructionTitle ||
    !tutorialBlock ||
    !tutorialFrame ||
    !taskCopy ||
    !statusMessage ||
    !previousButton ||
    !nextButton ||
    !startButton
  ) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const pid = params.get("pid")?.trim();
  const requestedStep = Number.parseInt(params.get("step") ?? "", 10);

  const [experimentRows, pageRows] = await Promise.all([
    loadCsvRows(EXPERIMENT_CONFIG_PATH),
    loadCsvRows(PAGE_CONTENT_PATH),
  ]);

  const experimentRow = pid ? experimentRows.find((row) => row.pid === pid) : experimentRows[0];
  if (!experimentRow) {
    instructionModal.hidden = false;
    syncBodyScroll();
    statusMessage.textContent = pid
      ? `No experiment configuration found for pid "${pid}".`
      : `No experiment configuration found in ${EXPERIMENT_CONFIG_PATH}.`;
    return;
  }

  const resolvedStep = resolveStep(experimentRow, requestedStep, CURRENT_PAGE_ID);
  if (!resolvedStep) {
    instructionModal.hidden = false;
    syncBodyScroll();
    statusMessage.textContent = `This page is not assigned to ${pid ?? experimentRow.pid} in the experiment config.`;
    return;
  }

  const mechanismCode = experimentRow[`step_${resolvedStep}_oversight_mechanism`];
  const mechanism = MECHANISM_MAP[mechanismCode];
  if (!mechanism) {
    instructionModal.hidden = false;
    syncBodyScroll();
    statusMessage.textContent = `Unknown oversight mechanism "${mechanismCode}" for step ${resolvedStep}.`;
    return;
  }

  const pageContent = pageRows.find((row) => row.page_id === CURRENT_PAGE_ID);
  if (!pageContent) {
    instructionModal.hidden = false;
    syncBodyScroll();
    statusMessage.textContent = `No page content found for ${CURRENT_PAGE_ID} in ${PAGE_CONTENT_PATH}.`;
    return;
  }

  currentMechanismName = mechanism.name;
  applyInstructionContent(
    {
      oversight_mechanism_name: mechanism.name,
      oversight_mechanism_tutorial_video: mechanism.tutorialVideo,
      task_description: pageContent.task_description,
      agent_prompt: pageContent.agent_prompt,
    },
    {
      pid,
      fallbackPid: experimentRow.pid,
      requestedStep,
      resolvedStep,
    },
  );
  navigationContext = buildNavigationContext(experimentRow, resolvedStep, pid);
  const { closeInstructionModal } = setupInstructionReminder({
    instructionModal,
    startButton,
    syncBodyScroll,
  });
  const { clearPromptCopyFeedback } = setupInstructionPromptCopy({
    onCopySuccess: closeInstructionModal,
  });
  const tutorialGate = setupInstructionVideoGate({
    instructionModal,
    tutorialFrame,
    nextButton,
    storageKey: buildTutorialGateStorageKey(pid ?? experimentRow.pid, resolvedStep),
  });

  let currentInstructionPage = 1;

  const renderStep = () => {
    const isTutorialStep = currentInstructionPage === 1;
    instructionStepLabel.textContent = isTutorialStep
      ? "Instruction Page 1 — Oversight Tutorial"
      : "Instruction Page 2 — Task Instructions";
    instructionTitle.textContent = isTutorialStep
      ? `${currentMechanismName} Oversight Mechanism`
      : `${currentMechanismName} Oversight Mechanism`;
    if (tutorialCopy) {
      tutorialCopy.hidden = !isTutorialStep;
    }
    tutorialBlock.hidden = !isTutorialStep;
    taskCopy.hidden = isTutorialStep;
    previousButton.hidden = isTutorialStep;
    nextButton.hidden = !isTutorialStep;
    startButton.hidden = isTutorialStep;
    nextButton.textContent = "I understand this oversight mechanism";
    progressDots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentInstructionPage - 1);
    });
    tutorialGate.sync();
  };

  previousButton.addEventListener("click", () => {
    currentInstructionPage = 1;
    clearPromptCopyFeedback();
    renderStep();
  });

  nextButton.addEventListener("click", () => {
    currentInstructionPage = 2;
    clearPromptCopyFeedback();
    renderStep();
  });

  startButton.addEventListener("click", () => {
    clearPromptCopyFeedback();
  });
  clearPromptCopyFeedback();
  instructionModal.hidden = false;
  renderStep();
  syncBodyScroll();
}

function applyInstructionContent(content, context) {
  document.querySelectorAll('[data-field="oversight-mechanism-name"]').forEach((node) => {
    node.textContent = content.oversight_mechanism_name;
  });
  document.querySelectorAll('[data-field="oversight-mechanism-name-2"]').forEach((node) => {
    node.textContent = content.oversight_mechanism_name;
  });

  const taskNode = document.querySelector('[data-field="task-description"]');
  const promptNode = document.querySelector('[data-field="agent-prompt"]');

  if (taskNode) {
    taskNode.textContent = content.task_description;
  }

  if (promptNode) {
    promptNode.textContent = content.agent_prompt;
  }

  ensureInstructionPersonaBlock(taskCopy);
  tutorialFrame.replaceChildren(buildTutorialNode(content.oversight_mechanism_tutorial_video));
  statusMessage.textContent = buildStatusMessage(context);
}

function buildStatusMessage({ pid, fallbackPid, requestedStep, resolvedStep }) {
  if (!pid) {
    return `Preview mode: no pid provided, using the first CSV row (${fallbackPid}) and step ${resolvedStep}.`;
  }

  if (!Number.isInteger(requestedStep) || requestedStep <= 0) {
    return `No step provided. Using the first ${CURRENT_PAGE_ID} assignment for pid ${pid}, which is step ${resolvedStep}.`;
  }

  if (requestedStep !== resolvedStep) {
    return `Requested step ${requestedStep} does not map to ${CURRENT_PAGE_ID}; using assigned step ${resolvedStep} instead.`;
  }

  return "";
}

function buildTutorialNode(value) {
  if (!value) {
    return createPlaceholder("Add a tutorial video URL for this oversight mechanism.");
  }

  if (/\.(mp4|webm|ogg)$/i.test(value)) {
    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.src = value;
    return video;
  }

  try {
    const url = new URL(value, window.location.href);
    const iframe = document.createElement("iframe");
    iframe.src = url.toString();
    iframe.title = "Oversight tutorial video";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    return iframe;
  } catch (_error) {
    return createPlaceholder(`Invalid tutorial video URL: ${value}`);
  }
}

function createPlaceholder(message) {
  const box = document.createElement("div");
  box.className = "tutorial-placeholder";
  box.textContent = message;
  return box;
}

async function loadCsvRows(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${path}.`);
  }

  return parseCsv(await response.text());
}

function parseCsv(text) {
  const records = [];
  let currentField = "";
  let currentRow = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
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
        index += 1;
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

  const [header = [], ...rows] = records;
  return rows.map((row) => {
    const item = {};
    header.forEach((key, index) => {
      item[key] = row[index] ?? "";
    });
    return item;
  });
}

function resolveStep(experimentRow, requestedStep, pageId) {
  if (Number.isInteger(requestedStep) && requestedStep > 0) {
    const stepPage = experimentRow[`step_${requestedStep}_page`];
    if (stepPage === pageId) {
      return requestedStep;
    }
  }

  for (let step = 1; step <= 4; step += 1) {
    if (experimentRow[`step_${step}_page`] === pageId) {
      return step;
    }
  }

  return null;
}

function syncBodyScroll() {
  const hasVisibleModal =
    (instructionModal && !instructionModal.hidden) || questionnaireModal.isQuestionnaireVisible();
  document.body.classList.toggle("modal-open", Boolean(hasVisibleModal));
}

function openSurveyModal() {
  questionnaireModal.openQuestionnaireModal();
}

function closeSurveyModal() {
  questionnaireModal.closeQuestionnaireModal();
}

function buildNavigationContext(experimentRow, currentStep, pid) {
  const effectivePid = pid ?? experimentRow.pid;
  const nextStep = currentStep + 1;

  if (nextStep > 4) {
    return {
      isComplete: true,
      nextUrl: null,
      currentStep,
      pid: effectivePid,
    };
  }

  const nextPageId = experimentRow[`step_${nextStep}_page`];
  if (!nextPageId) {
    return null;
  }

  return {
    isComplete: false,
    nextUrl: `../../pages/${nextPageId}/?pid=${encodeURIComponent(effectivePid)}&step=${nextStep}`,
    currentStep,
    pid: effectivePid,
  };
}

function buildTutorialGateStorageKey(pid, step) {
  return `oversight-study:tutorial-complete:${pid || "preview"}:${CURRENT_PAGE_ID}:step-${step}`;
}
