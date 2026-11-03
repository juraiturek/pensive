// Deterministic, SWOT-only packaging. No template runtime or production dependencies.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const framework = new URL('../frameworks/swot/', import.meta.url);
const Swot = require(fileURLToPath(new URL('state.js', framework)));

export async function buildCanvas(state = Swot.initialState()) {
  let html = await readFile(new URL('canvas.template.html', framework), 'utf8');
  const resources = [
    ['<!--pensive-style-->', 'canvas.css', 'style'],
    ['<!--pensive-review-->', '../../shared/proposal-review.js', 'script'],
    ['<!--pensive-review-ui-->', '../../shared/proposal-review-ui.js', 'script'],
    ['<!--pensive-core-->', 'state.js', 'script'],
    ['<!--pensive-runtime-->', 'canvas.js', 'script']
  ];
  for (const [marker, file, tag] of resources) {
    const source = await readFile(new URL(file, framework), 'utf8');
    if (source.toLowerCase().includes(`<${'/' + tag}`)) throw new Error(`Unsafe closing tag in ${file}.`);
    if (html.split(marker).length !== 2) throw new Error(`Expected one ${marker} slot.`);
    const attributes = tag === 'script' ? ' data-implementation' : '';
    html = html.replace(marker, () => `<${tag}${attributes}>\n${source}<${'/' + tag}>`);
  }
  return Swot.packageHtml(html, state);
}

export async function packageState(html, json) {
  return Swot.packageHtml(html, Swot.parseState(json));
}

async function main(args) {
  if (args.length === 0) {
    await writeFile(new URL('canvas.html', framework), await buildCanvas());
    console.log('Built frameworks/swot/canvas.html');
  } else if (args.length === 4 && args[0] === '--result') {
    const [, requestPath, responsePath, output] = args;
    const result = Swot.composeResult(JSON.parse(await readFile(requestPath, 'utf8')), JSON.parse(await readFile(responsePath, 'utf8')));
    const template = await readFile(new URL('canvas.html', framework), 'utf8');
    await writeFile(output, Swot.packageHtml(template, result), { flag: 'wx' });
    console.log(`Created ${output}`);
  } else if (args.length === 2) {
    const [input, output] = args;
    const template = await readFile(new URL('canvas.html', framework), 'utf8');
    const result = await packageState(template, await readFile(input, 'utf8'));
    // Exclusive creation: packaging never silently overwrites a user's artifact.
    await writeFile(output, result, { flag: 'wx' });
    console.log(`Created ${output}`);
  } else {
    throw new Error('Usage: node package-swot.mjs [state.json new-output.html | --result request.json response.json new-output.html]');
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
