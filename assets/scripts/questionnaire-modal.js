import { saveQuestionnaireResponse } from "./firebase-client.js";

const PROLIFIC_COMPLETION_CODE = "CKSHRB2J";

const POST_TASK_SURVEY_ITEMS = [
  {
    kind: "section",
    title: "Workload",
  },
  {
    kind: "scale",
    id: "mental_demand",
    prompt: "How mentally demanding was it to oversee the agent's operation?",
    options: ["Very Low", "Low", "Somewhat Low", "Moderate", "Somewhat High", "High", "Very High"],
  },
  {
    kind: "scale",
    id: "temporal_demand",
    prompt: "How hurried or rushed did you feel while overseeing the agent's operation?",
    options: ["Very Low", "Low", "Somewhat Low", "Moderate", "Somewhat High", "High", "Very High"],
  },
  {
    kind: "scale",
    id: "effort",
    prompt: "How hard did you have to work to oversee the agent's operation?",
    options: ["Very Low", "Low", "Somewhat Low", "Moderate", "Somewhat High", "High", "Very High"],
  },
  {
    kind: "scale",
    id: "stress",
    prompt: "How insecure, discouraged, irritated, or stressed did you feel while overseeing the agent's operation?",
    options: ["Very Low", "Low", "Somewhat Low", "Moderate", "Somewhat High", "High", "Very High"],
  },
  {
    kind: "scale",
    id: "performance",
    prompt: "How successful were you in overseeing the agent and ensuring it operated correctly?",
    options: ["Perfect", "Very Good", "Good", "Moderate", "Poor", "Very Poor", "Failure"],
  },
  {
    kind: "section",
    title: "Perceived Control",
    description:
      "Reflect on your interaction session with the AI agent. To what extent do you agree or disagree with the following statements?",
  },
  {
    kind: "scale",
    id: "feel_in_control",
    prompt: "I feel in control while using this AI agent.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "control_agent_behavior",
    prompt: "I feel I can control the way that the AI agent behaves.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "have_resources_and_ability",
    prompt: "I have the resources and the ability to make use of this AI agent.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "section",
    title: "Trust and Understanding",
  },
  {
    kind: "scale",
    id: "interprets_situations_correctly",
    prompt: "The agent is capable of interpreting situations correctly.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "works_reliably",
    prompt: "The agent works reliably.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "malfunction_likely",
    prompt: "An agent malfunction is likely.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "takes_over_complicated_tasks",
    prompt: "The agent is capable of taking over complicated tasks.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "can_rely_on_system",
    prompt: "I can rely on the agent.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "sporadic_errors",
    prompt: "The agent might make sporadic errors.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "system_state_clear",
    prompt: "The agent state was always clear to me.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "reacts_unpredictably",
    prompt: "The agent reacts unpredictably.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "understand_why_things_happened",
    prompt: "I was able to understand why things happened.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "difficult_to_identify_next_action",
    prompt: "It is difficult to identify what the agent will do next.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "trust_system",
    prompt: "I trust the agent.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "confident_in_capabilities",
    prompt: "I am confident about the agent's capabilities.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "section",
    title: "Usability",
    description:
      "Please check the box that reflects your immediate response to each statement. Don't think too long about each statement. Make sure you respond to every statement. If you don't know how to respond, simply check box \"Neutral.\"",
  },
  {
    kind: "scale",
    id: "would_like_to_use_frequently",
    prompt: "I think that I would like to use this oversight tool frequently.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "unnecessarily_complex",
    prompt: "I found the oversight tool unnecessarily complex.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "easy_to_use",
    prompt: "I thought this oversight tool was easy to use.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "need_technical_support",
    prompt: "I think that I would need the support of a technical person to be able to use this oversight tool.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "functions_well_integrated",
    prompt: "I found the various functions in this oversight tool were well integrated.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "too_much_inconsistency",
    prompt: "I thought there was too much inconsistency in this oversight tool.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "learn_quickly",
    prompt: "I would imagine that most people would learn to use this oversight tool very quickly.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "awkward_to_use",
    prompt: "I found the oversight tool very awkward to use.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "felt_confident_using_tool",
    prompt: "I felt very confident using the oversight tool.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "needed_to_learn_a_lot",
    prompt: "I needed to learn a lot of things before I could get going with this oversight tool.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "section",
    title: "Perceived Risk",
  },
  {
    kind: "scale",
    id: "perceived_risk",
    prompt: "How much risk do you perceive in this task when relying on this AI agent?",
    options: ["Not risky at all", "Slightly risky", "Moderate", "Risky", "Very risky"],
  },
];

const FINAL_QUESTIONNAIRE_ITEMS = [
  {
    kind: "section",
    title: "General Trust in Automation",
  },
  {
    kind: "scale",
    id: "careful_with_unfamiliar_automated_systems",
    prompt: "One should be careful with unfamiliar automated systems.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "rather_trust_than_mistrust",
    prompt: "I rather trust a system than I mistrust it.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "scale",
    id: "automated_systems_work_well",
    prompt: "Automated systems generally work well.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    kind: "section",
    title: "Prior AI Tool Experience",
  },
  {
    kind: "multiChoice",
    id: "used_ai_tools",
    prompt: "Which of the following AI tools have you used? (Select all that apply)",
    exclusiveOptions: ["None of the above"],
    options: [
      "AI agents that can operate websites or apps on my behalf (GUI agent: e.g., OpenAI Operator, Claude Computer Use)",
      "Other non-GUI AI agents (e.g., OpenClaw, Copilot, Cursor)",
      "AI chatbots (e.g., ChatGPT, Claude, Gemini)",
      "AI voice assistants (e.g., Siri, Alexa)",
      "None of the above",
    ],
  },
  {
    kind: "section",
    title: "Demographics",
  },
  {
    kind: "choice",
    id: "age",
    prompt: "What is your age?",
    options: ["18-24", "25-34", "35-44", "45-54", "55-64", "65 or above"],
  },
  {
    kind: "choice",
    id: "gender",
    prompt: "Gender",
    options: ["Female", "Male", "Non-binary / third gender", "Prefer not to say"],
  },
  {
    kind: "choice",
    id: "education",
    prompt: "What is the highest level of education you have completed?",
    options: [
      "Some school, no degree",
      "High school graduate, diploma or the equivalent (e.g. GED)",
      "Some college credit, no degree",
      "Bachelor's degree",
      "Master's degree",
      "Professional degree (e.g. MD, JD)",
      "Doctorate degree",
      "Prefer not to say",
    ],
  },
  {
    kind: "choice",
    id: "follow_up_interview",
    prompt: "Would you be willing to participate in a follow-up 30-minute interview to discuss your oversight behaviors during this study?",
    options: ["Yes", "No"],
  },
  {
    kind: "email",
    id: "follow_up_email",
    prompt: "Please enter your email address so we can contact you about the follow-up interview.",
    placeholder: "name@example.com",
    condition: {
      questionId: "follow_up_interview",
      equals: "Yes",
    },
  },
];

function createScaleQuestion(question) {
  const wrapper = document.createElement("fieldset");
  wrapper.className = "survey-question";
  wrapper.dataset.questionId = question.id;

  const legend = document.createElement("legend");
  legend.className = "survey-question-title";
  legend.textContent = question.prompt;

  const options = document.createElement("div");
  options.className = "survey-scale-options";
  if (question.options.length === 7) {
    options.classList.add("survey-scale-options-seven");
  }

  question.options.forEach((option, index) => {
    const optionId = `${question.id}-${index}`;
    const label = document.createElement("label");
    label.className = "survey-scale-option";
    if (question.options.length === 7) {
      label.classList.add("survey-scale-option-seven");
    }
    label.htmlFor = optionId;

    const input = document.createElement("input");
    input.type = "radio";
    input.name = question.id;
    input.id = optionId;
    input.value = String(index + 1);

    const text = document.createElement("span");
    text.textContent = option;

    label.append(input, text);
    options.append(label);
  });

  wrapper.append(legend, options);
  return wrapper;
}

function createSection(item) {
  const wrapper = document.createElement("section");
  wrapper.className = "survey-section";

  const title = document.createElement("h3");
  title.className = "survey-section-title";
  title.textContent = item.title;
  wrapper.append(title);

  if (item.description) {
    const description = document.createElement("p");
    description.className = "survey-section-description";
    description.textContent = item.description;
    wrapper.append(description);
  }

  return wrapper;
}

function createChoiceQuestion(question) {
  const wrapper = document.createElement("fieldset");
  wrapper.className = "survey-question";
  wrapper.dataset.questionId = question.id;

  const legend = document.createElement("legend");
  legend.className = "survey-question-title";
  legend.textContent = question.prompt;

  const options = document.createElement("div");
  options.className = "survey-choice-options";

  question.options.forEach((option, index) => {
    const optionId = `${question.id}-${index}`;
    const label = document.createElement("label");
    label.className = "survey-choice-option";
    label.htmlFor = optionId;

    const input = document.createElement("input");
    input.type = question.kind === "multiChoice" ? "checkbox" : "radio";
    input.name = question.id;
    input.id = optionId;
    input.value = option;

    const text = document.createElement("span");
    text.textContent = option;

    label.append(input, text);
    options.append(label);
  });

  wrapper.append(legend, options);
  return wrapper;
}

function createTextQuestion(question) {
  const wrapper = document.createElement("fieldset");
  wrapper.className = "survey-question";
  wrapper.dataset.questionId = question.id;

  const legend = document.createElement("legend");
  legend.className = "survey-question-title";
  legend.textContent = question.prompt;

  const input = document.createElement("input");
  input.className = "survey-text-input";
  input.type = question.kind === "email" ? "email" : "text";
  input.name = question.id;
  input.placeholder = question.placeholder ?? "";
  input.autocomplete = question.kind === "email" ? "email" : "on";

  wrapper.append(legend, input);
  return wrapper;
}

function getQuestionResponse(question, formBody) {
  if (question.kind === "multiChoice") {
    return [...formBody.querySelectorAll(`input[name="${question.id}"]:checked`)].map((input) => input.value);
  }

  if (question.kind === "choice" || question.kind === "scale") {
    return formBody.querySelector(`input[name="${question.id}"]:checked`)?.value ?? null;
  }

  if (question.kind === "text" || question.kind === "email") {
    return formBody.querySelector(`input[name="${question.id}"]`)?.value.trim() ?? "";
  }

  return null;
}

function isQuestionVisible(question, formBody) {
  if (!question.condition) {
    return true;
  }

  return getQuestionResponse({ kind: "choice", id: question.condition.questionId }, formBody) === question.condition.equals;
}

function syncConditionalQuestions(questions, formBody) {
  questions.forEach((question) => {
    if (!question.id) {
      return;
    }

    const wrapper = formBody.querySelector(`[data-question-id="${question.id}"]`);
    if (!wrapper) {
      return;
    }

    const visible = isQuestionVisible(question, formBody);
    wrapper.hidden = !visible;
    wrapper.querySelectorAll("input").forEach((input) => {
      input.disabled = !visible;
      if (!visible) {
        input.checked = false;
        input.value = input.type === "checkbox" || input.type === "radio" ? input.value : "";
      }
    });
  });
}

function buildQuestionnaire(config, formBody) {
  const fragment = document.createDocumentFragment();

  config.questions.forEach((item) => {
    if (item.kind === "section") {
      fragment.append(createSection(item));
      return;
    }

    if (item.kind === "scale") {
      fragment.append(createScaleQuestion(item));
      return;
    }

    if (item.kind === "choice" || item.kind === "multiChoice") {
      fragment.append(createChoiceQuestion(item));
      return;
    }

    if (item.kind === "text" || item.kind === "email") {
      fragment.append(createTextQuestion(item));
    }
  });

  formBody.replaceChildren(fragment);
}

function splitQuestionsIntoPages(questions) {
  const pages = [];
  let currentPage = [];

  questions.forEach((item) => {
    if (item.kind === "section") {
      if (currentPage.length > 0) {
        pages.push(currentPage);
      }
      currentPage = [item];
      return;
    }

    if (currentPage.length === 0) {
      currentPage = [item];
      return;
    }

    currentPage.push(item);
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [questions];
}

function applyResponsesToForm(questions, responses, formBody) {
  questions.forEach((question) => {
    if (!question.id || !(question.id in responses)) {
      return;
    }

    if (question.kind === "multiChoice") {
      const values = Array.isArray(responses[question.id]) ? responses[question.id] : [];
      formBody.querySelectorAll(`input[name="${question.id}"]`).forEach((input) => {
        input.checked = values.includes(input.value);
      });
      return;
    }

    if (question.kind === "choice" || question.kind === "scale") {
      const input = formBody.querySelector(`input[name="${question.id}"][value="${CSS.escape(String(responses[question.id]))}"]`);
      if (input) {
        input.checked = true;
      }
      return;
    }

    const input = formBody.querySelector(`input[name="${question.id}"]`);
    if (input) {
      input.value = responses[question.id];
    }
  });
}

function collectResponses(questions, formBody) {
  const responses = {};
  let isComplete = true;

  questions.forEach((question) => {
    if (!question.id) {
      return;
    }

    if (!isQuestionVisible(question, formBody)) {
      return;
    }

    if (question.kind === "multiChoice") {
      const selectedOptions = getQuestionResponse(question, formBody);
      if (selectedOptions.length === 0) {
        isComplete = false;
        return;
      }
      responses[question.id] = selectedOptions;
      return;
    }

    if (question.kind === "choice" || question.kind === "scale") {
      const selected = getQuestionResponse(question, formBody);
      if (!selected) {
        isComplete = false;
        return;
      }
      responses[question.id] = selected;
      return;
    }

    const value = getQuestionResponse(question, formBody);
    if (!value) {
      isComplete = false;
      return;
    }
    responses[question.id] = value;
  });

  return { isComplete, responses };
}

function collectStoredResponses(questions, responses) {
  let isComplete = true;
  const collected = {};

  questions.forEach((question) => {
    if (!question.id) {
      return;
    }

    if (question.condition) {
      const triggerValue = responses[question.condition.questionId];
      if (triggerValue !== question.condition.equals) {
        return;
      }
    }

    const value = responses[question.id];
    const isEmptyArray = Array.isArray(value) && value.length === 0;
    if (value == null || value === "" || isEmptyArray) {
      isComplete = false;
      return;
    }

    collected[question.id] = value;
  });

  return { isComplete, responses: collected };
}

export function setupQuestionnaireModal({ getNavigationContext, onCancel, onVisibilityChange }) {
  const modal = document.querySelector("#survey-modal");
  const kicker = document.querySelector("#survey-kicker");
  const title = document.querySelector("#survey-title");
  const copy = document.querySelector("#survey-copy");
  const form = document.querySelector("#survey-form");
  const formBody = document.querySelector("#survey-form-body");
  const status = document.querySelector("#survey-status");
  const cancelButton = document.querySelector("#survey-cancel");
  const continueButton = document.querySelector("#survey-continue");

  if (
    !modal ||
    !kicker ||
    !title ||
    !copy ||
    !form ||
    !formBody ||
    !status ||
    !cancelButton ||
    !continueButton
  ) {
    return {
      openQuestionnaireModal() {},
      closeQuestionnaireModal() {},
      isQuestionnaireVisible() {
        return false;
      },
    };
  }

  let activeConfig = null;
  let activeSequence = [];
  let activeSequenceIndex = 0;
  let activePageIndex = 0;
  let activePages = [];
  let activeResponses = {};

  const getActiveQuestions = () => activePages[activePageIndex] ?? activeConfig?.questions ?? [];

  const storeVisibleResponses = () => {
    if (!activeConfig) {
      return;
    }

    const visibleQuestions = getActiveQuestions().filter((question) => question.id && isQuestionVisible(question, formBody));
    const { responses } = collectResponses(visibleQuestions, formBody);
    activeResponses = { ...activeResponses, ...responses };

    getActiveQuestions().forEach((question) => {
      if (!question.id || isQuestionVisible(question, formBody)) {
        return;
      }
      delete activeResponses[question.id];
    });
  };

  const syncContinueState = () => {
    if (!activeConfig) {
      continueButton.disabled = true;
      return;
    }

    syncConditionalQuestions(getActiveQuestions(), formBody);
    storeVisibleResponses();
    const { isComplete } = collectResponses(getActiveQuestions(), formBody);
    continueButton.disabled = !isComplete;
    if (isComplete) {
      status.textContent = "";
    }
  };

  const syncExclusiveChoiceState = (changedInput) => {
    if (!activeConfig || !changedInput?.name) {
      return;
    }

    const question = activeConfig.questions.find((item) => item.id === changedInput.name);
    if (!question || question.kind !== "multiChoice" || !question.exclusiveOptions?.length) {
      return;
    }

    const inputs = [...formBody.querySelectorAll(`input[name="${question.id}"]`)];
    const exclusiveValues = new Set(question.exclusiveOptions);

    if (changedInput.checked && exclusiveValues.has(changedInput.value)) {
      inputs.forEach((input) => {
        if (input !== changedInput) {
          input.checked = false;
        }
      });
      return;
    }

    if (changedInput.checked) {
      inputs.forEach((input) => {
        if (exclusiveValues.has(input.value)) {
          input.checked = false;
        }
      });
    }
  };

  const closeQuestionnaireModal = () => {
    modal.hidden = true;
    if (typeof onVisibilityChange === "function") {
      onVisibilityChange();
    }
  };

  const persistResponses = async (questionnaireKey, responses, navigationContext) => {
    try {
      const payload = {
        questionnaire: questionnaireKey,
        step: navigationContext?.currentStep ?? null,
        pid: navigationContext?.pid ?? null,
        responses,
        savedAt: new Date().toISOString(),
      };
      window.sessionStorage.setItem(`oversight-study:${questionnaireKey}`, JSON.stringify(payload));
    } catch {
      // Ignore storage failures in restricted browsing environments.
    }

    await saveQuestionnaireResponse({
      pid: navigationContext?.pid ?? null,
      step: navigationContext?.currentStep ?? null,
      questionnaire: questionnaireKey,
      responses,
    });
  };

  const formatQuestionnaireSaveError = (error) => {
    if (!error) {
      return "Unknown error";
    }

    const parts = [];
    if (error.code) {
      parts.push(error.code);
    }
    if (error.message) {
      parts.push(error.message);
    }

    return parts.join(": ") || "Unknown error";
  };

  const submitQuestionnaire = async () => {
    if (activeConfig?.key === "completion") {
      window.location.href = new URL("../../", window.location.href).toString();
      return;
    }

    if (!activeConfig) {
      status.textContent = "Questionnaire configuration is unavailable.";
      return;
    }

    const navigationContext = getNavigationContext?.();
    syncConditionalQuestions(getActiveQuestions(), formBody);
    storeVisibleResponses();

    const currentPageQuestions = getActiveQuestions();
    const { isComplete } = collectResponses(currentPageQuestions, formBody);
    if (!isComplete) {
      status.textContent = "Please answer every question before continuing.";
      continueButton.disabled = true;
      return;
    }

    const hasNextPage = activePageIndex < activePages.length - 1;
    if (hasNextPage) {
      activePageIndex += 1;
      renderCurrentPage();
      return;
    }

    const { isComplete: questionnaireComplete, responses } = collectStoredResponses(
      activeConfig.questions,
      activeResponses,
    );

    if (!questionnaireComplete) {
      status.textContent = "Please answer every question before continuing.";
      continueButton.disabled = true;
      return;
    }

    continueButton.disabled = true;
    status.textContent = "Saving responses...";

    try {
      await persistResponses(activeConfig.key, responses, navigationContext);
    } catch (error) {
      console.error("Questionnaire save failed", error);
      status.textContent = `Could not save questionnaire responses: ${formatQuestionnaireSaveError(error)}`;
      syncContinueState();
      return;
    }

    const hasNextQuestionnaire = activeSequenceIndex < activeSequence.length - 1;
    if (hasNextQuestionnaire) {
      activeSequenceIndex += 1;
      renderQuestionnaire(activeSequence[activeSequenceIndex]);
      return;
    }

    if (navigationContext?.isComplete) {
      renderCompletionScreen();
      return;
    }

    if (!navigationContext?.nextUrl) {
      status.textContent = "Next-step routing is not available for this page.";
      return;
    }

    window.location.href = navigationContext.nextUrl;
  };

  const renderCurrentPage = () => {
    const pageLabel =
      activeConfig.paginateBySection && activePages.length > 1
        ? `Section ${activePageIndex + 1} of ${activePages.length}`
        : "";

    const copyParts = [activeConfig.copy, pageLabel].filter(Boolean);
    kicker.textContent = activeConfig.kicker;
    title.textContent = activeConfig.title;
    copy.textContent = copyParts.join(" ");
    form.hidden = false;
    cancelButton.hidden = activePageIndex === 0;
    cancelButton.textContent = "Back";
    continueButton.textContent =
      activePageIndex < activePages.length - 1 ? "Next" : activeConfig.continueLabel;
    status.textContent = "";
    form.reset();
    buildQuestionnaire({ questions: getActiveQuestions() }, formBody);
    applyResponsesToForm(getActiveQuestions(), activeResponses, formBody);
    syncConditionalQuestions(getActiveQuestions(), formBody);
    syncContinueState();
  };

  const renderQuestionnaire = (config) => {
    activeConfig = config;
    activeResponses = {};
    activePages = config.paginateBySection ? splitQuestionsIntoPages(config.questions) : [config.questions];
    activePageIndex = 0;
    renderCurrentPage();
  };

  const renderCompletionScreen = () => {
    activeConfig = { key: "completion", questions: [] };
    kicker.textContent = "Study Complete";
    title.textContent = "Final questionnaire submitted";
    copy.textContent = "Use the Prolific completion code below to claim your compensation on Prolific.";
    form.hidden = false;
    formBody.replaceChildren();

    const completionCard = document.createElement("section");
    completionCard.className = "survey-completion-card";
    completionCard.innerHTML = `
      <p class="survey-completion-label">Prolific Completion Code</p>
      <p class="survey-completion-code">${PROLIFIC_COMPLETION_CODE}</p>
      <p class="survey-completion-copy">Please copy this code and submit it on Prolific to receive compensation.</p>
    `;

    formBody.append(completionCard);
    cancelButton.hidden = true;
    continueButton.disabled = false;
    continueButton.textContent = "End experiment";
    status.textContent = "";
  };

  cancelButton.addEventListener("click", () => {
    if (activeConfig && activePageIndex > 0) {
      storeVisibleResponses();
      activePageIndex -= 1;
      renderCurrentPage();
      return;
    }

    closeQuestionnaireModal();
    if (typeof onCancel === "function") {
      onCancel();
    }
  });

  continueButton.addEventListener("click", submitQuestionnaire);

  form.addEventListener("change", (event) => {
    syncExclusiveChoiceState(event.target);
    syncContinueState();
  });

  form.addEventListener("input", () => {
    syncContinueState();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeQuestionnaireModal();
    }
  });

  return {
    openQuestionnaireModal() {
      const navigationContext = getNavigationContext?.();
      const isFinalStep = Boolean(navigationContext?.isComplete);
      activeSequence = isFinalStep
        ? [
            {
              key: "postTaskSurvey",
              kicker: "Post-task Survey",
              title: "Oversight Experience Survey",
              copy:
                "This step's task is complete.",
              continueLabel: "Continue to demographic survey",
              questions: POST_TASK_SURVEY_ITEMS,
              paginateBySection: true,
            },
            {
              key: "finalQuestionnaire",
              kicker: "Final Step",
              title: "Background and Experience Survey",
              copy: "Please complete this final questionnaire.",
              continueLabel: "Submit final questionnaire",
              questions: FINAL_QUESTIONNAIRE_ITEMS,
            },
          ]
        : [
            {
              key: "postTaskSurvey",
              kicker: "Post-task Survey",
              title: "Oversight Experience Survey",
              copy: "This step's task is complete.",
              continueLabel: "Continue to next step",
              questions: POST_TASK_SURVEY_ITEMS,
              paginateBySection: true,
            },
          ];
      activeSequenceIndex = 0;
      renderQuestionnaire(activeSequence[activeSequenceIndex]);
      modal.hidden = false;
      if (typeof onVisibilityChange === "function") {
        onVisibilityChange();
      }
    },
    closeQuestionnaireModal,
    isQuestionnaireVisible() {
      return !modal.hidden;
    },
  };
}
