import { setupQuestionnaireModal } from "./questionnaire-modal.js";
import { ensureInstructionPersonaBlock } from "./instruction-persona.js";
import { setupInstructionReminder } from "./instruction-reminder.js";
import { setupInstructionPromptCopy } from "./instruction-prompt-copy.js";

const eventsList = document.querySelector("#events-list");
const ticketListView = document.querySelector("#ticket-list-view");
const paymentView = document.querySelector("#payment-view");
const eventsFooter = document.querySelector("#events-footer");
const paymentForm = document.querySelector("#payment-form");
const paymentStatus = document.querySelector("#payment-status");
const orderSummaryToggle = document.querySelector("#order-summary-toggle");
const orderSummaryDetails = document.querySelector("#order-summary-details");
const orderTotal = document.querySelector("#order-total");
const chargeDisclaimer = document.querySelector("#charge-disclaimer");
const ticketProtectionLine = document.querySelector("#ticket-protection-line");
const ticketProtectionValue = document.querySelector("#ticket-protection-value");
const cardholderNameInput = document.querySelector("#cardholder-name");
const billingAddressInput = document.querySelector("#billing-address");
const billingZipInput = document.querySelector("#billing-zip");
const billingCityInput = document.querySelector("#billing-city");
const mobilePhoneInput = document.querySelector("#mobile-phone");
const cardNumberInput = document.querySelector("#card-number");
const cardMonthInput = document.querySelector("#card-month");
const cardYearInput = document.querySelector("#card-year");
const cardCvvInput = document.querySelector("#card-cvv");
const protectionInputs = Array.from(document.querySelectorAll('input[name="protection"]'));
const protectionOptions = Array.from(document.querySelectorAll(".protect-option"));
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
const staticLinks = Array.from(document.querySelectorAll('a[data-static-link]'));
const EXPERIMENT_CONFIG_PATH = "../../data/experiment-config.csv";
const PAGE_CONTENT_PATH = "../../data/page-content.csv";
const CURRENT_PAGE_ID = "page-5";
const QUALTRICS_SURVEY_URL = "https://qualtrics.com/";
const MECHANISM_MAP = {
  R1: { name: "Risk Gated", tutorialVideo: "../../assets/video/risk_gated_oversight_tutorial_h264.mp4" },
  R2: { name: "Supervisory Co-Execution", tutorialVideo: "../../assets/video/supervisory_co_execution_oversight_tutorial_h264.mp4" },
  R3: { name: "Action Confirmation", tutorialVideo: "../../assets/video/action_confirmation_oversight_tutorial_h264.mp4" },
  R4: { name: "Structural Amplification", tutorialVideo: "../../assets/video/structural_amplification_oversight_tutorial_h264.mp4" },
};

const events = [
  ["MON", "MAR 23", "6:45PM", "Exhibition: San Francisco Giants vs. Sultanes De Monterrey"],
  ["TUE", "MAR 24", "6:45PM", "Exhibition: San Francisco Giants vs. Sultanes De Monterrey"],
  ["WED", "MAR 25", "5:05PM", "San Francisco Giants vs. New York Yankees - Home Opener"],
  ["FRI", "MAR 27", "1:35PM", "San Francisco Giants vs. New York Yankees"],
  ["SAT", "MAR 28", "4:15PM", "San Francisco Giants vs. New York Yankees"],
  ["THU", "APR 2", "6:45PM", "San Francisco Giants vs. New York Mets"],
  ["FRI", "APR 3", "7:15PM", "San Francisco Giants vs. New York Mets"],
  ["SAT", "APR 4", "6:05PM", "San Francisco Giants vs. New York Mets"],
  ["SUN", "APR 5", "1:05PM", "San Francisco Giants vs. New York Mets"],
  ["MON", "APR 6", "6:45PM", "San Francisco Giants vs. Philadelphia Phillies"],
  ["TUE", "APR 7", "6:45PM", "San Francisco Giants vs. Philadelphia Phillies"],
  ["WED", "APR 8", "12:45PM", "San Francisco Giants vs. Philadelphia Phillies"],
  ["TUE", "APR 21", "6:45PM", "San Francisco Giants vs. Los Angeles Dodgers"],
  ["FRI", "APR 24", "7:15PM", "San Francisco Giants vs. Miami Marlins"],
  ["SAT", "APR 25", "1:05PM", "San Francisco Giants vs. Miami Marlins"],
  ["SUN", "APR 26", "1:05PM", "San Francisco Giants vs. Miami Marlins"],
  ["MON", "MAY 4", "6:45PM", "San Francisco Giants vs. San Diego Padres"],
  ["TUE", "MAY 5", "6:45PM", "San Francisco Giants vs. San Diego Padres"],
  ["FRI", "MAY 8", "7:15PM", "San Francisco Giants vs. Pittsburgh Pirates"],
  ["SUN", "MAY 10", "1:05PM", "San Francisco Giants vs. Pittsburgh Pirates"],
];
const BASE_TICKET_PRICE = 13.09;
const TICKET_PROTECTION_PRICE = 9.0;

let navigationContext = null;
let currentMechanismName = "Oversight";
const questionnaireModal = setupQuestionnaireModal({
  getNavigationContext: () => navigationContext,
  onVisibilityChange: syncBodyScroll,
});

disableIndexNavigation();
setupStaticLinks();
renderEvents();
setupPaymentFlow();
setupOrderSummary();
setupProtectionToggle();
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

function setupStaticLinks() {
  staticLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
    });
  });
}

function renderEvents() {
  if (!eventsList) return;
  const fragment = document.createDocumentFragment();
  events.forEach(([day, monthDate, time, name]) => {
    const row = document.createElement("article");
    row.className = "event-row";
    row.innerHTML = `
      <div class="event-date"><strong>${day}</strong><span>${monthDate}</span><span>${time}</span></div>
      <div class="event-info">
        <h2>${name}</h2>
        <p>Oracle Park</p>
        <p>📍 San Francisco, CA</p>
      </div>
    `;
    const button = document.createElement("button");
    button.className = "ticket-button";
    button.type = "button";
    button.textContent = "TICKETS";
    button.addEventListener("click", openPaymentView);
    row.append(button);
    fragment.append(row);
  });
  eventsList.replaceChildren(fragment);
}

function openPaymentView() {
  if (ticketListView) {
    ticketListView.hidden = true;
    ticketListView.classList.remove("active");
  }
  if (eventsFooter) {
    eventsFooter.hidden = true;
  }
  if (paymentView) {
    paymentView.hidden = false;
    paymentView.classList.add("active");
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

function setupPaymentFlow() {
  if (
    !paymentForm ||
    !paymentStatus ||
    !cardholderNameInput ||
    !billingAddressInput ||
    !billingZipInput ||
    !billingCityInput ||
    !mobilePhoneInput ||
    !cardNumberInput ||
    !cardMonthInput ||
    !cardYearInput ||
    !cardCvvInput
  ) {
    return;
  }

  paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (
      !cardholderNameInput.value.trim() ||
      !billingAddressInput.value.trim() ||
      !billingZipInput.value.trim() ||
      !billingCityInput.value.trim() ||
      !mobilePhoneInput.value.trim() ||
      !cardNumberInput.value.trim() ||
      !cardMonthInput.value.trim() ||
      !cardYearInput.value.trim() ||
      !cardCvvInput.value.trim()
    ) {
      paymentStatus.textContent = "Complete all required payment fields before placing the order.";
      return;
    }

    if (!/^\d{5}$/.test(billingZipInput.value.trim())) {
      paymentStatus.textContent = "Enter a valid 5-digit zip code.";
      return;
    }

    if (!/^\d{2}$/.test(cardMonthInput.value.trim()) || Number(cardMonthInput.value.trim()) < 1 || Number(cardMonthInput.value.trim()) > 12) {
      paymentStatus.textContent = "Enter a valid 2-digit expiration month.";
      return;
    }

    if (!/^\d{4}$/.test(cardYearInput.value.trim())) {
      paymentStatus.textContent = "Enter a valid 4-digit expiration year.";
      return;
    }

    paymentStatus.textContent = "";
    openSurveyModal();
  });
}

function setupOrderSummary() {
  if (!orderSummaryToggle || !orderSummaryDetails) {
    return;
  }

  orderSummaryToggle.addEventListener("click", () => {
    const isExpanded = orderSummaryToggle.getAttribute("aria-expanded") === "true";
    orderSummaryToggle.setAttribute("aria-expanded", String(!isExpanded));
    orderSummaryDetails.hidden = isExpanded;
  });
}

function getProtectionSelection() {
  return protectionInputs.find((input) => input.checked)?.value ?? "yes";
}

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function syncProtectionUi() {
  const hasProtection = getProtectionSelection() === "yes";
  const total = BASE_TICKET_PRICE + (hasProtection ? TICKET_PROTECTION_PRICE : 0);

  protectionOptions.forEach((option) => {
    const input = option.querySelector('input[name="protection"]');
    option.classList.toggle("selected", Boolean(input?.checked));
  });

  if (orderTotal) {
    orderTotal.textContent = `Order Total: ${formatCurrency(total)}`;
  }

  if (chargeDisclaimer) {
    chargeDisclaimer.textContent = `By clicking 'Place Order', you will be charged ${formatCurrency(total)}.`;
  }

  if (ticketProtectionLine) {
    ticketProtectionLine.hidden = !hasProtection;
  }

  if (ticketProtectionValue) {
    ticketProtectionValue.textContent = formatCurrency(hasProtection ? TICKET_PROTECTION_PRICE : 0);
  }
}

function setupProtectionToggle() {
  if (protectionInputs.length === 0) {
    return;
  }

  protectionInputs.forEach((input) => {
    input.addEventListener("change", syncProtectionUi);
  });

  syncProtectionUi();
}

async function setupInstructionModal() {
  if (!instructionModal || !instructionStepLabel || !instructionTitle || !tutorialBlock || !tutorialFrame || !taskCopy || !statusMessage || !previousButton || !nextButton || !startButton) return;

  const params = new URLSearchParams(window.location.search);
  const pid = params.get("pid")?.trim();
  const requestedStep = Number.parseInt(params.get("step") ?? "", 10);
  const [experimentRows, pageRows] = await Promise.all([loadCsvRows(EXPERIMENT_CONFIG_PATH), loadCsvRows(PAGE_CONTENT_PATH)]);
  const experimentRow = pid ? experimentRows.find((row) => row.pid === pid) : experimentRows[0];
  if (!experimentRow) {
    instructionModal.hidden = false;
    syncBodyScroll();
    statusMessage.textContent = pid ? `No experiment configuration found for pid "${pid}".` : `No experiment configuration found in ${EXPERIMENT_CONFIG_PATH}.`;
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
  applyInstructionContent({
    oversight_mechanism_name: mechanism.name,
    oversight_mechanism_tutorial_video: mechanism.tutorialVideo,
    task_description: pageContent.task_description,
    agent_prompt: pageContent.agent_prompt,
  }, { pid, fallbackPid: experimentRow.pid, requestedStep, resolvedStep });

  navigationContext = buildNavigationContext(experimentRow, resolvedStep, pid);
  const { clearPromptCopyFeedback } = setupInstructionPromptCopy();

  let currentInstructionPage = 1;
  const renderStep = () => {
    const isTutorialStep = currentInstructionPage === 1;
    instructionStepLabel.textContent = isTutorialStep ? "Instruction Page 1 — Oversight Tutorial" : "Instruction Page 2 — Task Instructions";
    instructionTitle.textContent = isTutorialStep ? `${currentMechanismName} Oversight Mechanism` : "Task Instructions";
    if (tutorialCopy) tutorialCopy.hidden = !isTutorialStep;
    tutorialBlock.hidden = !isTutorialStep;
    taskCopy.hidden = isTutorialStep;
    previousButton.hidden = isTutorialStep;
    nextButton.hidden = !isTutorialStep;
    startButton.hidden = isTutorialStep;
    nextButton.textContent = "I understand this oversight mechanism";
    progressDots.forEach((dot, index) => dot.classList.toggle("active", index === currentInstructionPage - 1));
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
  setupInstructionReminder({ instructionModal, startButton, syncBodyScroll });

  clearPromptCopyFeedback();
  instructionModal.hidden = false;
  renderStep();
  syncBodyScroll();
}

function applyInstructionContent(content, context) {
  document.querySelectorAll('[data-field="oversight-mechanism-name"]').forEach((node) => { node.textContent = content.oversight_mechanism_name; });
  document.querySelectorAll('[data-field="oversight-mechanism-name-2"]').forEach((node) => { node.textContent = content.oversight_mechanism_name; });
  const taskNode = document.querySelector('[data-field="task-description"]');
  const promptNode = document.querySelector('[data-field="agent-prompt"]');
  if (taskNode) taskNode.textContent = content.task_description;
  if (promptNode) promptNode.textContent = content.agent_prompt;
  ensureInstructionPersonaBlock(taskCopy);
  tutorialFrame.replaceChildren(buildTutorialNode(content.oversight_mechanism_tutorial_video));
  statusMessage.textContent = buildStatusMessage(context);
}

function buildStatusMessage({ pid, fallbackPid, requestedStep, resolvedStep }) {
  if (!pid) return `Preview mode: no pid provided, using the first CSV row (${fallbackPid}) and step ${resolvedStep}.`;
  if (!Number.isInteger(requestedStep) || requestedStep <= 0) return `No step provided. Using the first ${CURRENT_PAGE_ID} assignment for pid ${pid}, which is step ${resolvedStep}.`;
  if (requestedStep !== resolvedStep) return `Requested step ${requestedStep} does not map to ${CURRENT_PAGE_ID}; using assigned step ${resolvedStep} instead.`;
  return "";
}

function buildTutorialNode(value) {
  if (!value) return createPlaceholder("Add a tutorial video URL for this oversight mechanism.");
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
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    return iframe;
  } catch {
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
  if (!response.ok) throw new Error(`Could not load ${path}.`);
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
      if (char === "\r" && nextChar === "\n") index += 1;
      currentRow.push(currentField.trim());
      currentField = "";
      if (currentRow.some((field) => field.length > 0)) records.push(currentRow);
      currentRow = [];
      continue;
    }
    currentField += char;
  }
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) records.push(currentRow);
  }
  const [header = [], ...rows] = records;
  return rows.map((row) => {
    const item = {};
    header.forEach((key, index) => { item[key] = row[index] ?? ""; });
    return item;
  });
}

function resolveStep(experimentRow, requestedStep, pageId) {
  if (Number.isInteger(requestedStep) && requestedStep > 0) {
    const stepPage = experimentRow[`step_${requestedStep}_page`];
    if (stepPage === pageId) return requestedStep;
  }
  for (let step = 1; step <= 4; step += 1) {
    if (experimentRow[`step_${step}_page`] === pageId) return step;
  }
  return null;
}

function syncBodyScroll() {
  const hasVisibleModal = (instructionModal && !instructionModal.hidden) || questionnaireModal.isQuestionnaireVisible();
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
  if (nextStep > 4) return { isComplete: true, nextUrl: null, currentStep, pid: effectivePid };
  const nextPageId = experimentRow[`step_${nextStep}_page`];
  if (!nextPageId) return null;
  return {
    isComplete: false,
    nextUrl: `../../pages/${nextPageId}/?pid=${encodeURIComponent(effectivePid)}&step=${nextStep}`,
    currentStep,
    pid: effectivePid,
  };
}
