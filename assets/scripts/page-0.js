const postLaunchButton = document.querySelector("#post-launch-button");
const composerModal = document.querySelector("#composer-modal");
const composerForm = document.querySelector("#composer-form");
const composerText = document.querySelector("#composer-text");
const composerStatus = document.querySelector("#composer-status");
const composerCloseButton = document.querySelector("#composer-close");
const composerCancelButton = document.querySelector("#composer-cancel");
const readyModal = document.querySelector("#ready-modal");
const readyContinueButton = document.querySelector("#ready-continue");
const feedList = document.querySelector("#feed-list");
const practicePostAnchor = document.querySelector("#practice-post-anchor");
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
const staticLinks = Array.from(document.querySelectorAll("[data-static-link]"));

const EXPERIMENT_CONFIG_PATH = "../../data/experiment-config.csv";
const PAGE_CONTENT_PATH = "../../data/page-content.csv";
const CURRENT_PAGE_ID = "page-0";
const INITIAL_TUTORIAL_VIDEO = "../../assets/video/initial_tutorial.mp4";

let navigationContext = null;

setupStaticLinks();
setupPracticeFlow();
setupInstructionModal().catch((error) => {
  if (statusMessage && instructionModal) {
    instructionModal.hidden = false;
    syncBodyScroll();
    statusMessage.textContent = `Unable to load instruction config: ${error.message}`;
  }
});

function setupStaticLinks() {
  staticLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
    });
  });
}

function setupPracticeFlow() {
  if (
    !postLaunchButton ||
    !composerModal ||
    !composerForm ||
    !composerText ||
    !composerStatus ||
    !composerCloseButton ||
    !composerCancelButton ||
    !readyModal ||
    !readyContinueButton
  ) {
    return;
  }

  const toggleComposer = (isOpen) => {
    composerModal.hidden = !isOpen;
    if (!isOpen) {
      composerStatus.textContent = "";
    }
    syncBodyScroll();
  };

  postLaunchButton.addEventListener("click", () => {
    toggleComposer(true);
  });

  composerCloseButton.addEventListener("click", () => {
    toggleComposer(false);
  });

  composerCancelButton.addEventListener("click", () => {
    toggleComposer(false);
  });

  composerModal.addEventListener("click", (event) => {
    if (event.target === composerModal) {
      toggleComposer(false);
    }
  });

  composerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = composerText.value.trim();

    if (!value) {
      composerStatus.textContent = "Write a short practice post before continuing.";
      return;
    }

    insertPracticePost(value);
    composerText.value = "";
    toggleComposer(false);
    readyModal.hidden = false;
    syncBodyScroll();
  });

  readyContinueButton.addEventListener("click", () => {
    if (navigationContext?.nextUrl) {
      window.location.href = navigationContext.nextUrl;
      return;
    }

    readyModal.hidden = true;
    syncBodyScroll();
  });
}

function insertPracticePost(text) {
  if (!feedList || !practicePostAnchor) {
    return;
  }

  const post = document.createElement("article");
  post.className = "post-card user-practice-post";
  post.innerHTML = `
    <div class="avatar"></div>
    <div class="post-body">
      <div class="post-meta">
        <strong>User Name</strong>
        <span>@username</span>
        <span>· now</span>
      </div>
      <p>${escapeHtml(text)}</p>
      <div class="post-actions">
        <span>◌ 0</span>
        <span>↺ 0</span>
        <span>♥ 0</span>
        <span>◉ 1</span>
      </div>
    </div>
  `;

  feedList.insertBefore(post, practicePostAnchor);
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

  const pageContent = pageRows.find((row) => row.page_id === CURRENT_PAGE_ID);
  if (!pageContent) {
    instructionModal.hidden = false;
    syncBodyScroll();
    statusMessage.textContent = `No page content found for ${CURRENT_PAGE_ID} in ${PAGE_CONTENT_PATH}.`;
    return;
  }

  navigationContext = buildNavigationContext(experimentRow, pid);
  applyInstructionContent(pageContent, {
    pid,
    fallbackPid: experimentRow.pid,
  });

  let currentInstructionPage = 1;
  const renderStep = () => {
    const isTutorialStep = currentInstructionPage === 1;
    instructionStepLabel.textContent = isTutorialStep
      ? "Instruction Page 1 — Initial Tutorial"
      : "Instruction Page 2 — Practice Task";
    instructionTitle.textContent = isTutorialStep
      ? "Getting Familiar with the Interface"
      : "Practice Task";
    if (tutorialCopy) {
      tutorialCopy.hidden = !isTutorialStep;
    }
    tutorialBlock.hidden = !isTutorialStep;
    taskCopy.hidden = isTutorialStep;
    previousButton.hidden = isTutorialStep;
    nextButton.hidden = !isTutorialStep;
    startButton.hidden = isTutorialStep;
    nextButton.textContent = "I understand the tutorial";
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
  const taskNode = document.querySelector('[data-field="task-description"]');
  const promptNode = document.querySelector('[data-field="agent-prompt"]');

  if (taskNode) {
    taskNode.textContent = content.task_description;
  }

  if (promptNode) {
    promptNode.textContent = content.agent_prompt;
  }

  tutorialFrame.replaceChildren(buildTutorialNode(INITIAL_TUTORIAL_VIDEO));
  statusMessage.textContent = buildStatusMessage(context);
}

function buildStatusMessage({ pid, fallbackPid }) {
  if (!pid) {
    return `Preview mode: no pid provided, using the first CSV row (${fallbackPid}) and the shared page-0 warm-up.`;
  }

  return `Participant ${pid} will begin the shared warm-up first, then continue to the assigned step 1 page.`;
}

function buildTutorialNode(value) {
  if (!value) {
    return createPlaceholder("Add the initial tutorial video path for page-0.");
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
    iframe.title = "Initial tutorial video";
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

function buildNavigationContext(experimentRow, pid) {
  const effectivePid = pid ?? experimentRow.pid;
  const nextPageId = experimentRow.step_1_page;

  if (!nextPageId) {
    return {
      nextUrl: null,
      currentStep: 0,
      pid: effectivePid,
    };
  }

  return {
    nextUrl: `../../pages/${nextPageId}/?pid=${encodeURIComponent(effectivePid)}&step=1`,
    currentStep: 0,
    pid: effectivePid,
  };
}

function syncBodyScroll() {
  const hasVisibleModal =
    (instructionModal && !instructionModal.hidden) ||
    (composerModal && !composerModal.hidden) ||
    (readyModal && !readyModal.hidden);
  document.body.classList.toggle("modal-open", Boolean(hasVisibleModal));
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

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
