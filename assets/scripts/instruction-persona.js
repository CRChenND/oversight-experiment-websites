export function ensureInstructionPersonaBlock(taskCopy) {
  if (!taskCopy) {
    return;
  }

  const block = taskCopy.querySelector('[data-persona-block="true"]');
  if (block) {
    block.remove();
  }
}
