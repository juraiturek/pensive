/* Framework-local deterministic operations. V2 source/port details: docs/extraction-map.md. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FiveWhys = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const Notes = typeof module !== 'undefined' && module.exports ? require('../../shared/annotations.js') : Annotations;
  const Hats = typeof module !== 'undefined' && module.exports ? require('../../shared/six-hats.js') : SixHats;
  const framing = [
    'observable_symptom',
    'expected_condition',
    'system_or_process',
    'investigation_owner',
  ];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const fail = (message) => {
    throw new Error(message);
  };
  function object(value, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      fail(label + ' must be an object.');
  }
  function keys(value, required, optional = [], label = 'Object') {
    object(value, label);
    for (const k of required) if (!Object.hasOwn(value, k)) fail(label + ' missing ' + k);
    for (const k of Object.keys(value))
      if (!required.includes(k) && !optional.includes(k)) fail(label + ' unsupported key ' + k);
  }
  function string(v, label, nonempty = false) {
    if (typeof v !== 'string' || (nonempty && !v.trim()))
      fail(label + ' must be ' + (nonempty ? 'nonempty ' : '') + 'text.');
  }
  function identity(v, seen) {
    if (typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(v)) fail('Invalid ID.');
    if (seen.has(v)) fail('Duplicate ID: ' + v);
    seen.add(v);
  }
  function initialState() {
    return {
      framework: 'five_whys',
      schema_version: '1.0',
      content: {
        framing: Object.fromEntries(framing.map((k) => [k, ''])),
        tree: { id: 'root', text: '', children: [], is_terminal: false, output: null },
      },
      cursor: ['root'],
    };
  }
  function validateContent(content) {
    keys(content, ['framing', 'tree'], [], 'Content');
    keys(content.framing, framing, [], 'Framing');
    for (const k of framing) string(content.framing[k], k);
    const seen = new Set(),
      objects = new Set(),
      stack = [content.tree];
    while (stack.length) {
      const n = stack.pop();
      keys(n, ['id', 'text', 'children', 'is_terminal', 'output'], [], 'Tree node');
      if (objects.has(n)) fail('Cyclic/shared tree node.');
      objects.add(n);
      identity(n.id, seen);
      string(n.text, 'Node text');
      if (!Array.isArray(n.children)) fail('Children must be an array.');
      if (typeof n.is_terminal !== 'boolean') fail('Terminal flag must be boolean.');
      if (n.is_terminal) {
        if (n === content.tree || n.children.length) fail('Only a non-root leaf can be closed.');
        string(n.output, 'Countermeasure', true);
      } else if (n.output !== null) fail('Open node output must be null.');
      for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]);
    }
    return seen;
  }
  function validate(s) {
    keys(
      s,
      ['framework', 'schema_version', 'content', 'cursor'],
      ['thoughts', 'proposals', 'annotations'],
      'Canvas',
    );
    if (s.framework !== 'five_whys' || s.schema_version !== '1.0')
      fail('Unsupported framework/version.');
    const ids = validateContent(s.content);
    Notes.validate(s.annotations, 'node');
    if (s.thoughts !== undefined) {
      if (!Array.isArray(s.thoughts)) fail('Thoughts must be an array.');
      for (const t of s.thoughts) {
        if (t?.kind === 'six_hats') {
          Hats.validateThought(t, ids, s.framework);
          continue;
        }
        keys(t, ['id', 'kind', 'text'], [], 'Thought');
        identity(t.id, ids);
        if (!['evaluation', 'expansion'].includes(t.kind)) fail('Unsupported thought kind.');
        string(t.text, 'Thought', true);
      }
    }
    if (s.proposals !== undefined) {
      if (!Array.isArray(s.proposals) || s.proposals.length > 1)
        fail('At most one pending proposal.');
      for (const p of s.proposals) validateProposal(p, ids);
    }
    if (!Array.isArray(s.cursor) || !s.cursor.length || s.cursor[0] !== s.content.tree.id)
      fail('Invalid cursor.');
    let node = s.content.tree;
    for (const id of s.cursor.slice(1)) {
      node = node.children.find((c) => c.id === id);
      if (!node) fail('Invalid cursor path.');
    }
    return s;
  }
  function find(s, id) {
    const stack = [{ node: s.content.tree, parent: null, path: [s.content.tree.id] }];
    while (stack.length) {
      const r = stack.pop();
      if (r.node.id === id) return r;
      for (let i = r.node.children.length - 1; i >= 0; i--) {
        const n = r.node.children[i];
        stack.push({ node: n, parent: r.node, path: [...r.path, n.id] });
      }
    }
    fail('Node not found: ' + id);
  }
  function allIds(s) {
    const ids = validateContent(s.content);
    for (const t of s.thoughts || []) ids.add(t.id);
    for (const p of s.proposals || []) {
      ids.add(p.id);
      ids.add(p.thought.id);
      for (const c of p.children) ids.add(c.id);
      for (const id of validateContent(p.base_content)) ids.add(id);
    }
    return ids;
  }
  function newId(s, prefix = 'cause') {
    const used = allIds(s);
    let id;
    do {
      id = prefix + '_' + globalThis.crypto.randomUUID();
    } while (used.has(id));
    return id;
  }
  function preferred(s, path) {
    const result = [...path];
    let n = find(s, result.at(-1)).node;
    while (!n.is_terminal && n.children.length) {
      n = n.children[0];
      result.push(n.id);
    }
    return result;
  }
  function navigate(s, id) {
    validate(s);
    const path = find(s, id).path;
    s.cursor = preferred(s, path);
  }
  function editFraming(s, key, text) {
    validate(s);
    if (!framing.includes(key)) fail('Unknown framing field.');
    string(text, 'Framing');
    s.content.framing[key] = text;
  }
  function editText(s, id, text) {
    validate(s);
    string(text, 'Node text', true);
    const { node, parent } = find(s, id);
    if (!parent && node.children.length) fail('Problem statement is locked once branching begins.');
    node.text = text.trim();
  }
  function addChild(s, id, text) {
    validate(s);
    string(text, 'Cause text', true);
    const { node, path } = find(s, id);
    if (node.is_terminal) fail('Cannot add to a closed branch.');
    if (!s.content.tree.text.trim()) fail('State the problem before adding causes.');
    const child = {
      id: newId(s),
      text: text.trim(),
      children: [],
      is_terminal: false,
      output: null,
    };
    node.children.push(child);
    s.cursor = [...path, child.id];
    return child.id;
  }
  function closeBranch(s, id, output) {
    validate(s);
    string(output, 'Countermeasure', true);
    const { node, parent } = find(s, id);
    if (!parent || node.children.length) fail('Only a non-root leaf can be closed.');
    node.is_terminal = true;
    node.output = output.trim();
  }
  function reopen(s, id) {
    validate(s);
    const { node } = find(s, id);
    if (!node.is_terminal) fail('Branch is not closed.');
    node.is_terminal = false;
    node.output = null;
  }
  function deleteNode(s, id) {
    validate(s);
    const { node, parent, path } = find(s, id);
    if (!parent) fail('Cannot delete the problem statement.');
    const active = s.cursor.includes(id);
    parent.children.splice(parent.children.indexOf(node), 1);
    if (active) s.cursor = preferred(s, path.slice(0, -1));
  }
  const truncate = (text, max = 72) =>
    text.trim().length > max
      ? text
          .trim()
          .slice(0, max - 1)
          .trimEnd() + '…'
      : text.trim() || 'No text yet.';
  const role = (node, isRoot) =>
    node.is_terminal ? 'Investigated cause' : isRoot ? 'Problem Statement' : 'Cause';
  function strand(s) {
    validate(s);
    return s.cursor.map((id, i) => {
      const { node, parent } = find(s, id);
      return {
        id,
        text: node.text,
        depth: i,
        is_root: !parent,
        is_terminal: node.is_terminal,
        output: node.output,
        role_label: role(node, !parent),
        can_edit_text: !!parent || !node.children.length,
        can_add_child: !node.is_terminal,
        show_trifurcation_hint: !node.is_terminal && node.children.length >= 3,
        is_cursor_tip: i === s.cursor.length - 1,
        side_doors: parent
          ? parent.children
              .filter((n) => n.id !== id)
              .map((n) => ({
                target_node_id: n.id,
                label: n.text.trim() ? truncate(n.text, 48) : '(untitled)',
                full_text: n.text,
              }))
          : [],
        can_mark_terminal: !!parent && !node.is_terminal && !node.children.length,
      };
    });
  }
  // Mechanical port of V2 _build_tree_overview: leaf-unit spacing and orthogonal paths.
  function overview(s) {
    validate(s);
    const tree = s.content.tree,
      widths = new Map(),
      stack = [[tree, false]];
    while (stack.length) {
      const [n, visited] = stack.pop();
      if (visited)
        widths.set(
          n.id,
          Math.max(
            1,
            n.children.reduce((sum, c) => sum + widths.get(c.id), 0),
          ),
        );
      else {
        stack.push([n, true]);
        for (const c of n.children) stack.push([c, false]);
      }
    }
    const nodes = [],
      edges = [],
      todo = [{ n: tree, parent: null, depth: 0, start: 0 }],
      byId = new Map();
    let maxDepth = 0;
    while (todo.length) {
      const { n, parent, depth, start } = todo.pop(),
        x = 122 + (start + widths.get(n.id) / 2 - 0.5) * 228,
        y = 52 + depth * 148;
      maxDepth = Math.max(maxDepth, depth);
      const row = {
        id: n.id,
        text: truncate(n.text),
        full_text: n.text,
        output_text: n.output || '',
        x,
        y,
        depth,
        is_root: !parent,
        is_terminal: n.is_terminal,
        is_active_strand: s.cursor.includes(n.id),
        is_cursor_tip: n.id === s.cursor.at(-1),
        is_unresolved_leaf: !n.children.length && !n.is_terminal,
        role_label: role(n, !parent),
      };
      nodes.push(row);
      byId.set(n.id, row);
      if (parent) {
        const p = byId.get(parent),
          y1 = p.y + 43,
          y2 = y - 43,
          mid = (y1 + y2) / 2;
        edges.push({
          parent_id: parent,
          child_id: n.id,
          path: `M ${p.x.toFixed(2)} ${y1.toFixed(2)} L ${p.x.toFixed(2)} ${mid.toFixed(2)} L ${x.toFixed(2)} ${mid.toFixed(2)} L ${x.toFixed(2)} ${y2.toFixed(2)}`,
        });
      }
      let next = start;
      const children = [];
      for (const c of n.children) {
        children.push({ n: c, parent: n.id, depth: depth + 1, start: next });
        next += widths.get(c.id);
      }
      todo.push(...children.reverse());
    }
    return {
      nodes,
      edges,
      board_width: Math.max(960, widths.get(tree.id) * 228 + 244),
      board_height: Math.max(320, (maxDepth + 1) * 148 + 104),
    };
  }
  // Scopes are resolved against submitted state, never inferred from navigation cursor.
  function resolveTarget(s, action) {
    keys(action.target, ['type', 'id'], [], 'Target');
    if (action.target.type !== 'node') fail('Target must be a node.');
    string(action.target.id, 'Target ID', true);
    const found = find(s, action.target.id);
    if (!['deepen', 'branch'].includes(action.mode)) fail('Choose deepen or branch mode.');
    if (action.mode === 'branch' && !found.parent) fail('Cannot branch at root; use Deepen.');
    const parent = action.mode === 'deepen' ? found.node : found.parent;
    if (parent.is_terminal) fail('Cannot expand a closed branch.');
    return parent;
  }
  function validateProposal(p, ids) {
    keys(
      p,
      ['id', 'action', 'target', 'mode', 'parent_id', 'base_content', 'children', 'thought'],
      [],
      'Proposal',
    );
    identity(p.id, ids);
    if (p.action !== 'expand') fail('Unsupported proposal action.');
    validateContent(p.base_content);
    const base = { content: p.base_content };
    const parent = resolveTarget(base, p);
    if (parent.id !== p.parent_id) fail('Proposal parent does not match target/mode.');
    if (!Array.isArray(p.children) || !p.children.length) fail('Proposal must contain children.');
    const baseIds = validateContent(p.base_content),
      texts = new Set(parent.children.map((c) => c.text.trim().toLowerCase()));
    const ancestorTexts = new Set(
      find(base, parent.id).path.map((id) => find(base, id).node.text.trim().toLowerCase()),
    );
    for (const c of p.children) {
      keys(c, ['id', 'text', 'children', 'is_terminal', 'output'], [], 'Proposed cause');
      identity(c.id, ids);
      if (baseIds.has(c.id)) fail('Proposed ID collides with existing cause.');
      string(c.text, 'Proposed cause', true);
      if (
        !Array.isArray(c.children) ||
        c.children.length ||
        c.is_terminal !== false ||
        c.output !== null
      )
        fail('Only new direct open leaf causes may be proposed.');
      const normalized = c.text.trim().toLowerCase();
      if (texts.has(normalized) || ancestorTexts.has(normalized))
        fail('Redundant or circular cause text.');
      texts.add(normalized);
    }
    keys(p.thought, ['id', 'kind', 'text'], [], 'Proposal thought');
    identity(p.thought.id, ids);
    if (baseIds.has(p.id) || baseIds.has(p.thought.id))
      fail('Proposal identity collides with base content.');
    if (p.thought.kind !== 'expansion') fail('Invalid proposal thought.');
    string(p.thought.text, 'Thought', true);
  }
  function validateRequest(request) {
    keys(request, ['canvas', 'action'], [], 'Request');
    validate(request.canvas);
    if (request.canvas.proposals?.length) fail('Resolve pending proposal first.');
    if (request.action?.id === 'six_hats') {
      Hats.validateAction(request.canvas, request.action);
      return request;
    }
    const a = request.action;
    keys(
      a,
      ['id'],
      ['comment', 'use_thoughts', ...(a.id === 'expand' ? ['target', 'mode'] : [])],
      'Action',
    );
    if (!['evaluate', 'expand'].includes(a.id)) fail('Unsupported action.');
    if (a.comment !== undefined) string(a.comment, 'Comment');
    if (a.use_thoughts !== undefined && typeof a.use_thoughts !== 'boolean')
      fail('use_thoughts must be boolean.');
    if (a.id === 'expand') {
      if (!request.canvas.content.tree.text.trim()) fail('State the problem before expansion.');
      resolveTarget(request.canvas, a);
    }
    return request;
  }
  function buildRequest(s, action) {
    validateRequest({ canvas: s, action });
    return clone({ canvas: s, action });
  }
  function composeResult(request, response) {
    validateRequest(request);
    if (request.action.id === 'six_hats') return validate(Hats.append(request.canvas, request.action, response));
    const expanding = request.action.id === 'expand';
    keys(response, ['thought', ...(expanding ? ['children'] : [])], [], 'Response');
    string(response.thought, 'Thought', true);
    const s = clone(request.canvas);
    if (!expanding) {
      s.thoughts = [
        ...(s.thoughts || []),
        { id: newId(s, 'thought'), kind: 'evaluation', text: response.thought },
      ];
      return validate(s);
    }
    if (!Array.isArray(response.children)) fail('Children response must be an array.');
    if (!response.children.length) {
      s.thoughts = [
        ...(s.thoughts || []),
        { id: newId(s, 'thought'), kind: 'expansion', text: response.thought },
      ];
      return validate(s);
    }
    const ids = allIds(s),
      allocate = (prefix) => {
        let id;
        do {
          id = prefix + '_' + globalThis.crypto.randomUUID();
        } while (ids.has(id));
        ids.add(id);
        return id;
      };
    const children = response.children.map((c) => {
      keys(c, ['text'], [], 'Child response');
      string(c.text, 'Cause', true);
      return {
        id: allocate('cause'),
        text: c.text,
        children: [],
        is_terminal: false,
        output: null,
      };
    });
    s.proposals = [
      {
        id: allocate('proposal'),
        action: 'expand',
        target: clone(request.action.target),
        mode: request.action.mode,
        parent_id: resolveTarget(s, request.action).id,
        base_content: clone(s.content),
        children,
        thought: { id: allocate('thought'), kind: 'expansion', text: response.thought },
      },
    ];
    return validate(s);
  }
  function resolveProposal(s, decision) {
    validate(s);
    if (!['accept', 'reject'].includes(decision)) fail('Unknown review decision.');
    const p = s.proposals?.[0];
    if (!p) fail('No pending proposal.');
    if (decision === 'reject') {
      delete s.proposals;
      return;
    }
    if (JSON.stringify(s.content) !== JSON.stringify(p.base_content))
      fail(
        'Proposal is stale after content or framing edits. Reject it and request a fresh expansion.',
      );
    const candidate = clone(s);
    delete candidate.proposals;
    const parent = resolveTarget(candidate, p);
    if (parent.id !== p.parent_id) fail('Proposal parent mismatch.');
    parent.children.push(...clone(p.children));
    candidate.thoughts = [...(candidate.thoughts || []), clone(p.thought)];
    validate(candidate);
    s.content = candidate.content;
    s.thoughts = candidate.thoughts;
    delete s.proposals;
  }
  function parseState(json) {
    let s;
    try {
      s = JSON.parse(json);
    } catch {
      fail('Invalid JSON.');
    }
    return validate(s);
  }
  function packageHtml(html, s) {
    validate(s);
    const start = '<!--pensive-' + 'state-start-->',
      end = '<!--pensive-' + 'state-end-->';
    if (html.split(start).length !== 2 || html.split(end).length !== 2)
      fail('Expected one state slot.');
    const a = html.indexOf(start),
      b = html.indexOf(end);
    if (b < a) fail('Invalid state slot.');
    const json = JSON.stringify(s, null, 2)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
    return (
      html.slice(0, a + start.length) +
      '\n<script id="canvas-state" type="application/json">' +
      json +
      '<' +
      '/script>\n' +
      html.slice(b)
    );
  }
  return {
    resolveProposal,
    buildRequest,
    validateRequest,
    composeResult,
    parseState,
    packageHtml,
    framing,
    initialState,
    validate,
    validateContent,
    find,
    navigate,
    editFraming,
    editText,
    addChild,
    closeBranch,
    reopen,
    deleteNode,
    strand,
    overview,
    clone,
  };
});
