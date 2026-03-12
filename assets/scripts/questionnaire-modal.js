import { saveQuestionnaireResponse } from "./firebase-client.js";

const TLX_QUESTIONS = [
  {
    id: "mental_demand",
    prompt: "How mentally demanding was the task?",
    lowLabel: "1 = Very low",
    highLabel: "7 = Very high",
  },
  {
    id: "physical_demand",
    prompt: "How physically demanding was the task?",
    lowLabel: "1 = Very low",
    highLabel: "7 = Very high",
  },
  {
    id: "temporal_demand",
    prompt: "How hurried or rushed was the pace of the task?",
    lowLabel: "1 = Very slow",
    highLabel: "7 = Very rushed",
  },
  {
    id: "performance",
    prompt: "How successful were you in accomplishing what you were asked to do?",
    lowLabel: "1 = Not successful at all",
    highLabel: "7 = Completely successful",
  },
  {
    id: "effort",
    prompt: "How hard did you have to work to accomplish your level of performance?",
    lowLabel: "1 = Very low effort",
    highLabel: "7 = Very high effort",
  },
  {
    id: "frustration",
    prompt: "How insecure, discouraged, irritated, stressed, and annoyed were you?",
    lowLabel: "1 = Not at all",
    highLabel: "7 = Very much",
  },
];

const DEMOGRAPHIC_QUESTIONS = [
  {
    id: "age_range",
    prompt: "What is your age range?",
    options: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "Prefer not to say"],
  },
  {
    id: "gender_identity",
    prompt: "What is your gender identity?",
    options: ["Woman", "Man", "Non-binary", "Another identity", "Prefer not to say"],
  },
  {
    id: "education",
    prompt: "What is the highest level of education you have completed?",
    options: [
      "High school or less",
      "Some college",
      "Bachelor's degree",
      "Master's degree",
      "Doctoral or professional degree",
      "Prefer not to say",
    ],
  },
  {
    id: "employment_status",
    prompt: "What is your current employment status?",
    options: [
      "Student",
      "Employed full-time",
      "Employed part-time",
      "Self-employed",
      "Unemployed",
      "Prefer not to say",
    ],
  },
  {
    id: "region",
    prompt: "Which region do you currently live in?",
    options: [
      "United States",
      "Canada",
      "Europe",
      "Asia-Pacific",
      "Latin America",
      "Africa or Middle East",
      "Prefer not to say",
    ],
  },
  {
    id: "primary_language",
    prompt: "What is your primary language?",
    options: ["English", "Chinese", "Spanish", "Another language", "Prefer not to say"],
  },
];

function createScaleQuestion(question) {
  const wrapper = document.createElement("fieldset");
  wrapper.className = "survey-question";
  wrapper.dataset.questionId = question.id;

  const legend = document.createElement("legend");
  legend.className = "survey-question-title";
  legend.textContent = question.prompt;

  const scaleLabels = document.createElement("div");
  scaleLabels.className = "survey-scale-labels";

  const low = document.createElement("span");
  low.textContent = question.lowLabel;

  const high = document.createElement("span");
  high.textContent = question.highLabel;

  scaleLabels.append(low, high);

  const options = document.createElement("div");
  options.className = "survey-scale-options";

  for (let value = 1; value <= 7; value += 1) {
    const label = document.createElement("label");
    label.className = "survey-scale-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = question.id;
    input.value = String(value);

    const text = document.createElement("span");
    text.textContent = String(value);

    label.append(input, text);
    options.append(label);
  }

  wrapper.append(legend, scaleLabels, options);
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
    input.type = "radio";
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

function buildQuestionnaire(config, formBody) {
  const fragment = document.createDocumentFragment();

  config.questions.forEach((question) => {
    fragment.append(
      config.type === "tlx" ? createScaleQuestion(question) : createChoiceQuestion(question),
    );
  });

  formBody.replaceChildren(fragment);
}

function collectResponses(questions, formBody) {
  const responses = {};
  let isComplete = true;

  questions.forEach((question) => {
    const selected = formBody.querySelector(`input[name="${question.id}"]:checked`);
    if (!selected) {
      isComplete = false;
      return;
    }
    responses[question.id] = selected.value;
  });

  return { isComplete, responses };
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

  const syncContinueState = () => {
    if (!activeConfig) {
      continueButton.disabled = true;
      return;
    }

    const { isComplete } = collectResponses(activeConfig.questions, formBody);
    continueButton.disabled = !isComplete;
    if (isComplete) {
      status.textContent = "";
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

  const submitQuestionnaire = async () => {
    if (!activeConfig) {
      status.textContent = "Questionnaire configuration is unavailable.";
      return;
    }

    const navigationContext = getNavigationContext?.();
    const { isComplete, responses } = collectResponses(activeConfig.questions, formBody);
    if (!isComplete) {
      status.textContent = "Please answer every question before continuing.";
      continueButton.disabled = true;
      return;
    }

    continueButton.disabled = true;
    status.textContent = "Saving responses...";

    try {
      await persistResponses(activeConfig.key, responses, navigationContext);
    } catch (error) {
      status.textContent = `Could not save questionnaire responses: ${error.message}`;
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
      status.textContent = "Demographic survey submitted. Returning to the PID entry page...";
      window.location.href = new URL("../../", window.location.href).toString();
      return;
    }

    if (!navigationContext?.nextUrl) {
      status.textContent = "Next-step routing is not available for this page.";
      return;
    }

    window.location.href = navigationContext.nextUrl;
  };

  const renderQuestionnaire = (config) => {
    activeConfig = config;
    kicker.textContent = config.kicker;
    title.textContent = config.title;
    copy.textContent = config.copy;
    cancelButton.hidden = false;
    continueButton.textContent = config.continueLabel;
    status.textContent = "";
    form.reset();
    buildQuestionnaire(config, formBody);
    syncContinueState();
  };

  cancelButton.addEventListener("click", () => {
    closeQuestionnaireModal();
    if (typeof onCancel === "function") {
      onCancel();
    }
  });

  continueButton.addEventListener("click", submitQuestionnaire);

  form.addEventListener("change", syncContinueState);

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
              key: "tlx",
              type: "tlx",
              kicker: "Post-task Survey",
              title: "NASA Task Load Index (TLX)",
              copy: "Please rate each item on the 7-point scale. All six responses are required before you can continue.",
              continueLabel: "Continue to demographic survey",
              questions: TLX_QUESTIONS,
            },
            {
              key: "demographics",
              type: "demographic",
              kicker: "Final Step",
              title: "Demographic Information",
              copy: "Please complete this demographic questionnaire before finishing the study.",
              continueLabel: "Submit demographics",
              questions: DEMOGRAPHIC_QUESTIONS,
            },
          ]
        : [
            {
              key: "tlx",
              type: "tlx",
              kicker: "Post-task Survey",
              title: "NASA Task Load Index (TLX)",
              copy: "Please rate each item on the 7-point scale. All six responses are required before you can continue.",
              continueLabel: "Continue to next step",
              questions: TLX_QUESTIONS,
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
