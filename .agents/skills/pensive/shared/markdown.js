/* Deliberately small offline Markdown subset. No HTML interpretation or external assets. */
const PensiveMarkdown = (() => {
  'use strict';
  function safeUrl(value) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || /[\s\\\u0000-\u001f\u007f]/.test(value)) return null;
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
  }
  const cells = line => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
  const separator = line => cells(line).every(cell => /^:?-{3,}:?$/.test(cell));
  function blocks(markdown) {
    const lines = markdown.replace(/\r\n?/g, '\n').split('\n'), result = [];
    for (let i = 0; i < lines.length;) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      const heading = /^(#{1,6})\s+(.+)$/.exec(line);
      if (heading) { result.push({ type: 'heading', level: heading[1].length, text: heading[2] }); i++; continue; }
      if (line.includes('|') && i + 1 < lines.length && lines[i+1].includes('|') && separator(lines[i+1])) {
        const header = cells(line), rows = []; i += 2;
        while (i < lines.length && lines[i].trim() && lines[i].includes('|')) rows.push(cells(lines[i++]));
        result.push({ type: 'table', header, rows }); continue;
      }
      if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
        const ordered = /^\s*\d+\./.test(line), items = [], pattern = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*+]\s+/;
        while (i < lines.length && pattern.test(lines[i])) items.push(lines[i++].replace(pattern,''));
        result.push({ type: 'list', ordered, items }); continue;
      }
      const text = [line]; i++;
      while (i < lines.length && lines[i].trim() && !/^(#{1,6})\s|^\s*[-*+]\s|^\s*\d+\.\s/.test(lines[i]) && !(lines[i].includes('|') && i+1 < lines.length && separator(lines[i+1]))) text.push(lines[i++]);
      result.push({ type: 'paragraph', text: text.join('\n') });
    }
    return result;
  }
  function inline(document, parent, text) {
    // Images remain literal; inline formatting does not recursively parse untrusted markup.
    const pattern = /(?<!!)\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
    let start = 0;
    for (const match of text.matchAll(pattern)) {
      parent.append(document.createTextNode(text.slice(start,match.index)));
      if (match[1] && safeUrl(match[2])) { const a = document.createElement('a'); a.textContent = match[1]; a.href = safeUrl(match[2]); a.target = '_blank'; a.rel = 'noopener noreferrer'; parent.append(a); }
      else if (match[3] || match[4]) { const e = document.createElement(match[3] ? 'strong' : 'em'); e.textContent = match[3] || match[4]; parent.append(e); }
      else parent.append(document.createTextNode(match[0]));
      start = match.index + match[0].length;
    }
    parent.append(document.createTextNode(text.slice(start)));
  }
  function render(document, markdown) {
    const root = document.createElement('div'); root.className = 'markdown';
    const textNode = (tag, text) => { const node = document.createElement(tag); inline(document,node,text); return node; };
    for (const block of blocks(markdown)) {
      if (block.type === 'table') {
        const wrapper = document.createElement('div'); wrapper.className = 'markdown-table'; const table = document.createElement('table');
        const head = document.createElement('thead'), row = document.createElement('tr'); for (const text of block.header) row.append(textNode('th',text)); head.append(row); table.append(head);
        const body = document.createElement('tbody'); for (const cells of block.rows) { const row = document.createElement('tr'); for (let i=0;i<block.header.length;i++) row.append(textNode('td',cells[i] ?? '')); body.append(row); } table.append(body); wrapper.append(table); root.append(wrapper);
      } else if (block.type === 'list') { const list = document.createElement(block.ordered ? 'ol' : 'ul'); for (const item of block.items) list.append(textNode('li',item)); root.append(list); }
      else root.append(textNode(block.type === 'heading' ? `h${Math.max(3,block.level)}` : 'p',block.text));
    }
    return root;
  }
  return Object.freeze({ blocks, safeUrl, render });
})();
if (typeof module !== 'undefined' && module.exports) module.exports = PensiveMarkdown;
