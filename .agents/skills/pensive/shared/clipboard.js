/* One click-driven clipboard attempt with a portable manual-copy fallback. */
const ClipboardCopy = (() => {
  'use strict';
  async function copy(json, {message = 'Copied complete JSON to clipboard.', status, actionRequest = false}) {
    const panel = document.querySelector('#clipboard-fallback');
    try {
      await navigator.clipboard.writeText(json);
    } catch {
      const input = panel.querySelector('#clipboard-json');
      let instructions = panel.querySelector('p');
      if (!instructions) {
        instructions = document.createElement('p');
        input.before(instructions);
      }
      panel.querySelector('label').textContent = actionRequest ? 'AI request JSON' : 'Canvas JSON';
      instructions.textContent = 'Clipboard access is unavailable or blocked. Press ⌘C on Mac or Ctrl+C on Windows/Linux to copy the selected JSON. ' + (actionRequest
        ? 'Paste this complete canvas and selected action into your assistant with the Pensive skill.'
        : 'Paste this JSON into your assistant with the Pensive skill for discussion or the selected action.');
      panel.hidden = false;
      input.value = json;
      input.focus();
      input.select();
      input.scrollIntoView({block:'center'});
      status('Clipboard access blocked or unavailable. Press ⌘C or Ctrl+C to copy the selected JSON.', true);
      return false;
    }
    panel.hidden = true;
    status(message);
    return true;
  }
  return Object.freeze({copy});
})();
