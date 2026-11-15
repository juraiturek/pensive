/* Portable JSON files. No network or persistent filesystem permission is required. */
const JsonFiles = (() => {
  'use strict';
  function install({getState, validate, status, canExport = () => true}) {
    const input = document.createElement('input');
    input.type = 'file'; input.id = 'import-file'; input.accept = '.json,application/json';
    const label = document.createElement('label'); label.textContent = 'Load JSON file'; label.append(input);
    document.querySelector('#import-json').before(label);
    let generation = 0;
    input.addEventListener('change', async () => {
      const current = ++generation, file = input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        if (current !== generation || !document.querySelector('#import-dialog').open) return;
        document.querySelector('#import-json').value = text;
        document.querySelector('#import-error').textContent = '';
      } catch (error) { document.querySelector('#import-error').textContent = `Could not read JSON: ${error.message}`; }
      finally { if (current === generation) input.value = ''; }
    });
    document.querySelector('#import-dialog').addEventListener('close', () => { generation++; input.value = ''; });
    const download = document.createElement('button');
    download.type = 'button'; download.id = 'download-json'; download.textContent = 'Download JSON';
    document.querySelector('#copy').after(download);
    download.addEventListener('click', () => {
      try {
        if (!canExport()) throw new Error('Finish or cancel the open editor before exporting JSON.');
        const state = getState(); validate(state);
        const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2) + '\n'], {type:'application/json'}));
        const link = document.createElement('a'); link.href = url; link.download = 'current.json';
        document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        status('JSON download started. Keep it for your next assistant turn or load it into this HTML.');
      } catch (error) { status(`Could not export JSON: ${error.message}`, true); }
    });
  }
  return {install};
})();
