export const PAGE_LIBRARY = {
  page_intro: {
    title: "Page 1: Interface Orientation",
    summary: "Participants familiarize themselves with the GUI agent workspace.",
    prompt:
      "Review the visible interface elements and describe which parts you would monitor first during a GUI agent run.",
  },
  page_observation: {
    title: "Page 2: Observation Task",
    summary: "Participants inspect an ongoing agent action sequence.",
    prompt:
      "Watch the agent's current behavior and identify signals that suggest the task is on-track or drifting.",
  },
  page_comparison: {
    title: "Page 3: Comparison Task",
    summary: "Participants compare two possible agent behaviors.",
    prompt:
      "Compare the presented options and decide which behavior deserves closer oversight attention.",
  },
  page_diagnosis: {
    title: "Page 4: Diagnosis Task",
    summary: "Participants infer the likely cause of an oversight issue.",
    prompt:
      "Diagnose the most plausible source of failure or risk in the GUI agent workflow and justify your reasoning.",
  },
  page_intervention: {
    title: "Page 5: Intervention Task",
    summary: "Participants choose whether and how to intervene.",
    prompt:
      "Decide whether human intervention is needed now, and if so, specify the least disruptive intervention.",
  },
  page_reflection: {
    title: "Page 6: Reflection Task",
    summary: "Participants reflect on how oversight should be improved.",
    prompt:
      "Reflect on the oversight process and note one change that would improve reliability for future runs.",
  },
};

export const INSTRUCTION_LIBRARY = {
  inst_a: {
    title: "Instruction A",
    body:
      "Prioritize safety. Focus first on actions that could create irreversible errors or user-visible harm.",
  },
  inst_b: {
    title: "Instruction B",
    body:
      "Prioritize efficiency. Focus on whether the agent is making progress with minimal unnecessary interaction.",
  },
  inst_c: {
    title: "Instruction C",
    body:
      "Prioritize explainability. Focus on whether the observed agent behavior can be clearly interpreted.",
  },
  inst_d: {
    title: "Instruction D",
    body:
      "Prioritize anomaly detection. Focus on identifying subtle deviations from the expected workflow.",
  },
  inst_e: {
    title: "Instruction E",
    body:
      "Prioritize intervention timing. Focus on when a supervisor should step in rather than what the agent did overall.",
  },
  inst_f: {
    title: "Instruction F",
    body:
      "Prioritize evidence collection. Focus on collecting the strongest signals you would cite in a later review.",
  },
};
