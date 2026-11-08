'use strict';

const SixHats = (() => {
  const hats = Object.freeze({
    white: 'Facts and data',
    red: 'Feelings and intuition',
    black: 'Caution and critique',
    yellow: 'Benefits and value',
    green: 'Creativity and alternatives',
    blue: 'Process and direction',
  });
  const title = hat => hat[0].toUpperCase() + hat.slice(1) + ' Hat';
  const nonblank = value => typeof value === 'string' && !!value.trim();
  const validId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);
  const own = (object, key) => Object.hasOwn(object, key);
  const itemTypes = framework => framework === 'five_forces' ? ['section'] : framework === 'swot' ? ['factor', 'strategy'] : framework === 'five_whys' ? ['node'] : ['item'];

  function keys(value, required, optional, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        required.some(key => !own(value, key)) ||
        Object.keys(value).some(key => !required.includes(key) && !optional.includes(key))) {
      throw new Error('Invalid ' + label + '.');
    }
  }

  function targets(canvas) {
    const { content, framework } = canvas;
    const choices = [{ type: 'canvas', label: 'Full canvas' }];
    const add = (type, item, section) => {
      if (nonblank(item.text)) choices.push({ type, id: item.id, label: item.text, section });
    };
    if (framework === 'five_forces') {
      for (const section of ['new_entrants', 'substitutes', 'buyers', 'suppliers', 'rivalry']) choices.push({type:'section', id:section, label:section.replaceAll('_', ' ')});
    } else if (framework === 'five_whys') {
      const stack = [content.tree];
      while (stack.length) {
        const node = stack.pop();
        add('node', node);
        for (let index = node.children.length - 1; index >= 0; index--) stack.push(node.children[index]);
      }
    } else {
      const groups = framework === 'swot'
        ? [['factor', content], ['strategy', content.strategies]]
        : [['item', content]];
      for (const [type, collections] of groups) {
        for (const [section, items] of Object.entries(collections)) {
          if (Array.isArray(items)) for (const item of items) add(type, item, section);
        }
      }
    }
    return choices;
  }

  function validateHat(hat) {
    if (typeof hat !== 'string' || !own(hats, hat)) throw new Error('Choose one of the six thinking hats.');
  }

  function validateTarget(target, framework) {
    keys(target, target?.type === 'canvas' ? ['type'] : ['type', 'id'], [], 'Six Hats target');
    if (target.type !== 'canvas' && (!itemTypes(framework).includes(target.type) || !validId(target.id)))
      throw new Error('Invalid Six Hats target type or ID for this framework.');
  }

  function resolve(canvas, target) {
    return targets(canvas).find(choice => choice.type === target.type && choice.id === target.id);
  }

  function validateAction(canvas, action) {
    keys(action, ['id', 'hat', 'target'], ['comment', 'use_thoughts'], 'Six Hats action');
    validateHat(action.hat);
    validateTarget(action.target, canvas.framework);
    const choices = targets(canvas);
    if (!choices.some(choice => choice.type === action.target.type && choice.id === action.target.id))
      throw new Error('The Six Hats target is unavailable or blank.');
    if (action.target.type === 'canvas' && choices.length === 1 &&
        !Object.values(canvas.content.framing).some(nonblank))
      throw new Error('Add framing or analytical content before applying a thinking hat.');
    if ((own(action, 'comment') && typeof action.comment !== 'string') ||
        (own(action, 'use_thoughts') && typeof action.use_thoughts !== 'boolean'))
      throw new Error('Invalid Six Hats guidance.');
  }

  function validateReflection(value) {
    for (const field of ['observations', 'suggestions']) {
      if (field === 'suggestions' && !own(value, field)) continue;
      if (!Array.isArray(value[field]) || !value[field].length || !Array.from(value[field]).every(nonblank))
        throw new Error('Six Hats ' + field + ' must be a nonempty array of nonblank strings.');
    }
  }

  function validateThought(thought, ids, framework) {
    keys(thought, ['id', 'kind', 'hat', 'target', 'target_label', 'observations'], ['suggestions'], 'Six Hats thought');
    validateHat(thought.hat);
    validateTarget(thought.target, framework);
    if (!nonblank(thought.target_label) || !validId(thought.id) || ids.has(thought.id))
      throw new Error('Invalid Six Hats thought label or duplicate/invalid ID.');
    validateReflection(thought);
    ids.add(thought.id);
  }

  function append(canvas, action, response) {
    keys(response, ['observations'], ['suggestions'], 'Six Hats response');
    validateReflection(response);
    const result = structuredClone(canvas);
    const thought = {
      id: 'thought-' + globalThis.crypto.randomUUID(),
      kind: 'six_hats',
      hat: action.hat,
      target: structuredClone(action.target),
      target_label: resolve(canvas, action.target).label,
      ...structuredClone(response),
    };
    result.thoughts = [...(result.thoughts || []), thought];
    return result;
  }

  return Object.freeze({ hats, title, targets, resolve, validateAction, validateThought, append });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SixHats;
