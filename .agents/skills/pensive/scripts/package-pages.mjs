// PAGES-only packaging. Shared Pensive presentation is included at build time.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const framework = new URL('../frameworks/pages/', import.meta.url);
const Pages = createRequire(import.meta.url)(fileURLToPath(new URL('state.js', framework)));
export async function buildCanvas(state = Pages.initialState()) {
  let html = await readFile(new URL('canvas.template.html', framework), 'utf8');
  const styles = await Promise.all(['../swot/canvas.css', 'canvas.css'].map(p => readFile(new URL(p, framework), 'utf8')));
  const resources = [
    ['<!--pensive-style-->', styles.join('\n'), 'style'],
    ['<!--pensive-ordering-style-->', await readFile(new URL('../../shared/collection-ordering.css', framework), 'utf8'), 'style'],
    ['<!--pensive-review-->', await readFile(new URL('../../shared/proposal-review.js', framework), 'utf8'), 'script'],
    ['<!--pensive-review-ui-->', await readFile(new URL('../../shared/proposal-review-ui.js', framework), 'utf8'), 'script'],
    ['<!--pensive-annotations-style-->', await readFile(new URL('../../shared/annotations.css', framework), 'utf8'), 'style'],
    ['<!--pensive-annotations-ui-->', await readFile(new URL('../../shared/annotations-ui.js', framework), 'utf8'), 'script'],
    ['<!--pensive-annotations-->', await readFile(new URL('../../shared/annotations.js', framework), 'utf8'), 'script'],
    ['<!--pensive-takeaways-ui-->', await readFile(new URL('../../shared/takeaways-ui.js', framework), 'utf8'), 'script'],
    ['<!--pensive-takeaways-->', await readFile(new URL('../../shared/takeaways.js', framework), 'utf8'), 'script'],
    ['<!--pensive-core-->', await readFile(new URL('state.js', framework), 'utf8'), 'script'],
    ['<!--pensive-six-hats-->', await readFile(new URL('../../shared/six-hats.js', framework), 'utf8'), 'script'],
    ['<!--pensive-six-hats-ui-->', await readFile(new URL('../../shared/six-hats-ui.js', framework), 'utf8'), 'script'],
    ['<!--pensive-editing-->', await readFile(new URL('../../shared/canvas-editing.js', framework), 'utf8'), 'script'],
    ['<!--pensive-runtime-->', await readFile(new URL('canvas.js', framework), 'utf8'), 'script']
  ];
  for (const [marker, source, tag] of resources) {
    if (source.toLowerCase().includes(`<${'/' + tag}`)) throw new Error(`Unsafe closing tag in ${tag} source.`);
    if (html.split(marker).length !== 2) throw new Error(`Expected one ${marker} slot.`);
    html = html.replace(marker, () => `<${tag}${tag === 'script' ? ' data-implementation' : ''}>\n${source}<${'/' + tag}>`);
  }
  return Pages.packageHtml(html, state);
}
export async function packageState(html, json) { return Pages.packageHtml(html, Pages.parseState(json)); }
async function main(args) {
  if (!args.length) {
    await writeFile(new URL('canvas.html', framework), await buildCanvas());
    console.log('Built frameworks/pages/canvas.html');
    return;
  }
  let state, output;
  if (args.length === 4 && args[0] === '--result') {
    state = Pages.composeResult(JSON.parse(await readFile(args[1], 'utf8')), JSON.parse(await readFile(args[2], 'utf8'))); output = args[3];
  } else if (args.length === 2) { state = Pages.parseState(await readFile(args[0], 'utf8')); output = args[1]; }
  else throw new Error('Usage: node package-pages.mjs [state.json new-output.html | --result request.json response.json new-output.html]');
  const html = await readFile(new URL('canvas.html', framework), 'utf8');
  await writeFile(output, Pages.packageHtml(html, state), { flag: 'wx' });
  console.log(`Created ${output}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2)).catch(e => { console.error(e.message); process.exitCode = 1; });
