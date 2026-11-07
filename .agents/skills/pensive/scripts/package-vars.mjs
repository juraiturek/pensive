// VARS-only deterministic packaging into the established standalone implementation.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const framework = new URL('../frameworks/vars/', import.meta.url);
const Vars = createRequire(import.meta.url)(fileURLToPath(new URL('state.js', framework)));
export async function buildCanvas(state = Vars.initialState()) {
  let html = await readFile(new URL('canvas.template.html', framework), 'utf8');
  const styles = await Promise.all(['../swot/canvas.css', 'canvas.css'].map(p => readFile(new URL(p, framework), 'utf8')));
  for (const [marker, source, tag] of [
    ['<!--pensive-style-->', styles.join('\n'), 'style'],
    ['<!--pensive-ordering-style-->', await readFile(new URL('../../shared/collection-ordering.css', framework), 'utf8'), 'style'],
    ['<!--pensive-markdown-style-->', await readFile(new URL('../../shared/markdown.css', framework), 'utf8'), 'style'],
    ['<!--pensive-markdown-->', await readFile(new URL('../../shared/markdown.js', framework), 'utf8'), 'script'],
    ['<!--pensive-review-->', await readFile(new URL('../../shared/proposal-review.js', framework), 'utf8'), 'script'],
    ['<!--pensive-review-ui-->', await readFile(new URL('../../shared/proposal-review-ui.js', framework), 'utf8'), 'script'],
    ['<!--pensive-annotations-style-->', await readFile(new URL('../../shared/annotations.css', framework), 'utf8'), 'style'],
    ['<!--pensive-annotations-->', await readFile(new URL('../../shared/annotations.js', framework), 'utf8'), 'script'],
    ['<!--pensive-annotations-ui-->', await readFile(new URL('../../shared/annotations-ui.js', framework), 'utf8'), 'script'],
    ['<!--pensive-takeaways-ui-->', await readFile(new URL('../../shared/takeaways-ui.js', framework), 'utf8'), 'script'],
    ['<!--pensive-takeaways-->', await readFile(new URL('../../shared/takeaways.js', framework), 'utf8'), 'script'],
    ['<!--pensive-research-->', await readFile(new URL('../../shared/research.js', framework), 'utf8'), 'script'],
    ['<!--pensive-research-ui-->', await readFile(new URL('../../shared/research-ui.js', framework), 'utf8'), 'script'],
    ['<!--pensive-core-->', await readFile(new URL('state.js', framework), 'utf8'), 'script'],
    ['<!--pensive-six-hats-->', await readFile(new URL('../../shared/six-hats.js', framework), 'utf8'), 'script'],
    ['<!--pensive-six-hats-ui-->', await readFile(new URL('../../shared/six-hats-ui.js', framework), 'utf8'), 'script'],
    ['<!--pensive-editing-->', await readFile(new URL('../../shared/canvas-editing.js', framework), 'utf8'), 'script'],
    ['<!--pensive-runtime-->', await readFile(new URL('canvas.js', framework), 'utf8'), 'script']
  ]) {
    if (source.toLowerCase().includes(`<${'/' + tag}`)) throw new Error(`Unsafe closing tag in ${tag} source.`);
    if (html.split(marker).length !== 2) throw new Error(`Expected one ${marker} slot.`);
    html = html.replace(marker, () => `<${tag}${tag === 'script' ? ' data-implementation' : ''}>\n${source}<${'/' + tag}>`);
  }
  return Vars.packageHtml(html, state);
}
export async function packageState(html, json) { return Vars.packageHtml(html, Vars.parseState(json)); }
async function main(args) {
  if (!args.length) { await writeFile(new URL('canvas.html', framework), await buildCanvas()); console.log('Built frameworks/vars/canvas.html'); return; }
  let state, output;
  if (args.length === 4 && args[0] === '--result') {
    state = Vars.composeResult(JSON.parse(await readFile(args[1], 'utf8')), JSON.parse(await readFile(args[2], 'utf8'))); output = args[3];
  } else if (args.length === 2) { state = Vars.parseState(await readFile(args[0], 'utf8')); output = args[1]; }
  else throw new Error('Usage: node package-vars.mjs [state.json new-output.html | --result request.json response.json new-output.html]');
  const html = await readFile(new URL('canvas.html', framework), 'utf8');
  await writeFile(output, Vars.packageHtml(html, state), { flag: 'wx' }); console.log(`Created ${output}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2)).catch(e => { console.error(e.message); process.exitCode = 1; });
