'use strict';

const SixHatsUI = (() => {
  function element(tag, text) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function card(canvas, thought) {
    const article = element('article');
    article.className = 'thought';
    article.append(element('h3', SixHats.title(thought.hat) + ' · ' + thought.target_label));
    if (!SixHats.resolve(canvas, thought.target)) article.append(element('p', 'Target unavailable'));
    for (const [title, entries] of [['Observations', thought.observations], ['Suggestions', thought.suggestions]]) {
      if (!entries) continue;
      const list = element('ul');
      for (const entry of entries) list.append(element('li', entry));
      article.append(element('h4', title), list);
    }
    return article;
  }

  function install(getState, core, copyJson) {
    const button = document.getElementById('thinking-tools');
    const dialog = document.getElementById('thinking-tools-dialog');
    const form = dialog.querySelector('form');
    const hat = form.elements.hat;
    const target = form.elements.target;
    const error = dialog.querySelector('[role="alert"]');
    let choices;
    for (const [id, focus] of Object.entries(SixHats.hats))
      hat.add(new Option(SixHats.title(id) + ' — ' + focus, id));

    button.addEventListener('click', () => {
      form.reset();
      error.textContent = '';
      choices = SixHats.targets(getState());
      target.replaceChildren(...choices.map((choice, index) => {
        const prefix = choice.section?.replaceAll('_', ' ') || (choice.id ? 'Node' : '');
        const label = prefix ? prefix + ' · ' + choice.label : choice.label;
        return new Option(label.length > 160 ? label.slice(0, 157) + '…' : label, index);
      }));
      dialog.showModal();
    });
    dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close());
    form.addEventListener('submit', async event => {
      event.preventDefault();
      try {
        const choice = choices[Number(target.value)];
        const selection = choice.id ? { type: choice.type, id: choice.id } : { type: 'canvas' };
        const request = core.buildRequest(getState(), {
          id: 'six_hats', hat: hat.value, target: selection,
          comment: form.elements.comment.value, use_thoughts: form.elements.use_thoughts.checked,
        });
        dialog.close();
        await copyJson(JSON.stringify(request, null, 2), 'Copied Six Hats request. Paste it into Codex or ChatGPT with the Pensive skill.', true);
      } catch (err) {
        error.textContent = err.message;
      }
    });
  }

  return Object.freeze({ card, install });
})();
