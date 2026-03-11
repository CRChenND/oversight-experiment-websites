const prequalModal = document.querySelector("#prequal-modal");
const prequalOpenButton = document.querySelector('[data-open-modal="prequal-modal"]');
const prequalCloseButton = document.querySelector("[data-close-modal]");
const prequalForm = document.querySelector("#prequal-form");
const surveyModal = document.querySelector("#survey-modal");
const surveyLink = document.querySelector("#survey-link");
const surveyCheckbox = document.querySelector("#survey-complete-checkbox");
const surveyStatus = document.querySelector("#survey-status");
const surveyCancelButton = document.querySelector("#survey-cancel");
const surveyContinueButton = document.querySelector("#survey-continue");
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
const CURRENT_PAGE_ID = "page-1";
const QUALTRICS_SURVEY_URL = "https://qualtrics.com/";
const MECHANISM_MAP = {
  R1: {
    name: "Risk Gated",
    tutorialVideo: "../../assets/video/risk_gated_oversight_tutorial.mp4",
  },
  R2: {
    name: "Supervisory Co-Execution",
    tutorialVideo: "../../assets/video/supervisory_co_execution_oversight_tutorial.mp4",
  },
  R3: {
    name: "Action Confirmation",
    tutorialVideo: "../../assets/video/action_confirmation_oversight_tutorial.mp4",
  },
  R4: {
    name: "Structural Amplification",
    tutorialVideo: "../../assets/video/structural_amplification_oversight_tutorial.mp4",
  },
};
let navigationContext = null;

setupPrequalModal();
setupInstructionModal().catch((error) => {
  if (statusMessage && instructionModal) {
    instructionModal.hidden = false;
    syncBodyScroll();
    statusMessage.textContent = `Unable to load instruction config: ${error.message}`;
  }
});

function setupPrequalModal() {
  if (!prequalModal || !prequalOpenButton || !prequalCloseButton || !prequalForm) {
    return;
  }

  const toggleModal = (isOpen) => {
    prequalModal.hidden = !isOpen;
    syncBodyScroll();
  };

  prequalOpenButton.addEventListener("click", () => {
    toggleModal(true);
  });

  prequalCloseButton.addEventListener("click", () => {
    toggleModal(false);
  });

  prequalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    toggleModal(false);
    openSurveyModal();
  });

  prequalModal.addEventListener("click", (event) => {
    if (event.target === prequalModal) {
      toggleModal(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !prequalModal.hidden) {
      toggleModal(false);
    }
  });
}

function setupSurveyModal() {
  if (
    !surveyModal ||
    !surveyLink ||
    !surveyCheckbox ||
    !surveyStatus ||
    !surveyCancelButton ||
    !surveyContinueButton
  ) {
    return;
  }

  surveyLink.href = QUALTRICS_SURVEY_URL;

  surveyCheckbox.addEventListener("change", () => {
    surveyContinueButton.disabled = !surveyCheckbox.checked;
    if (!surveyCheckbox.checked) {
      surveyStatus.textContent = "";
      return;
    }

    surveyStatus.textContent = navigationContext?.isComplete
      ? "Survey completion confirmed. You can finish this task."
      : "Survey completion confirmed. You can continue to the next step.";
  });

  surveyCancelButton.addEventListener("click", () => {
    closeSurveyModal();
    if (prequalModal) {
      prequalModal.hidden = false;
      syncBodyScroll();
    }
  });

  surveyContinueButton.addEventListener("click", () => {
    if (!navigationContext) {
      surveyStatus.textContent = "Next-step routing is not available for this page.";
      return;
    }

    if (navigationContext.isComplete) {
      surveyStatus.textContent = "Task complete. You may close this page.";
      surveyContinueButton.disabled = true;
      surveyContinueButton.textContent = "Task completed";
      surveyCancelButton.hidden = true;
      return;
    }

    window.location.href = navigationContext.nextUrl;
  });

  surveyModal.addEventListener("click", (event) => {
    if (event.target === surveyModal) {
      closeSurveyModal();
    }
  });
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
  setupSurveyModal();

  let currentInstructionPage = 1;

  const renderStep = () => {
    const isTutorialStep = currentInstructionPage === 1;
    instructionStepLabel.textContent = isTutorialStep
      ? "Instruction Page 1 — Oversight Tutorial"
      : "Instruction Page 2 — Task Instructions";
    instructionTitle.textContent = isTutorialStep
      ? "Getting Familiar with the Oversight Interface"
      : "Task Instructions";
    if (tutorialCopy) {
      tutorialCopy.hidden = !isTutorialStep;
    }
    tutorialBlock.hidden = !isTutorialStep;
    taskCopy.hidden = isTutorialStep;
    previousButton.hidden = isTutorialStep;
    nextButton.hidden = !isTutorialStep;
    startButton.hidden = isTutorialStep;
    progressDots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentInstructionPage - 1);
    });
  };

  previousButton.addEventListener("click", () => {
    currentInstructionPage = 1;
    renderStep();
  });

  nextButton.addEventListener("click", () => {
    currentInstructionPage = 2;
    renderStep();
  });

  startButton.addEventListener("click", () => {
    instructionModal.hidden = true;
    syncBodyScroll();
  });

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
    (prequalModal && !prequalModal.hidden) ||
    (instructionModal && !instructionModal.hidden) ||
    (surveyModal && !surveyModal.hidden);
  document.body.classList.toggle("modal-open", Boolean(hasVisibleModal));
}

function openSurveyModal() {
  if (
    !surveyModal ||
    !surveyCheckbox ||
    !surveyContinueButton ||
    !surveyStatus ||
    !surveyCancelButton
  ) {
    return;
  }

  surveyCheckbox.checked = false;
  surveyContinueButton.disabled = true;
  surveyCancelButton.hidden = false;
  surveyContinueButton.textContent = navigationContext?.isComplete
    ? "Finish task"
    : "Continue to next step";
  surveyStatus.textContent = navigationContext?.isComplete
    ? "Complete the Qualtrics survey, then confirm to finish this task."
    : "Complete the Qualtrics survey, then confirm to continue.";
  surveyModal.hidden = false;
  syncBodyScroll();
}

function closeSurveyModal() {
  if (!surveyModal) {
    return;
  }

  surveyModal.hidden = true;
  syncBodyScroll();
}

function buildNavigationContext(experimentRow, currentStep, pid) {
  const effectivePid = pid ?? experimentRow.pid;
  const nextStep = currentStep + 1;

  if (nextStep > 4) {
    return {
      isComplete: true,
      nextUrl: null,
    };
  }

  const nextPageId = experimentRow[`step_${nextStep}_page`];
  if (!nextPageId) {
    return null;
  }

  return {
    isComplete: false,
    nextUrl: `../../pages/${nextPageId}/?pid=${encodeURIComponent(effectivePid)}&step=${nextStep}`,
  };
}
