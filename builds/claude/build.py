#!/usr/bin/env python3
"""Build and locally validate an experimental Claude skill. Standard library only."""
import argparse
import hashlib
import io
from pathlib import Path
import re
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / '.agents/skills/pensive'
DESCRIPTION = ('Use Pensive for SWOT/TOWS, PAGES, Value Proposition Canvas, 5 Whys, '
               'Six Thinking Hats, framework selection, and analytical actions on complete canvas JSON.')

def sha(data):
    return hashlib.sha256(data).hexdigest()

def archive(files):
    out = io.BytesIO()
    with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_STORED) as z:
        for name, data in sorted(files.items()):
            info = zipfile.ZipInfo('pensive/' + name, (1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            z.writestr(info, data)
    return out.getvalue()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version', required=True, help='Candidate artifact version; does not authorize release')
    parser.add_argument('--output-dir', type=Path, required=True)
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    if not re.fullmatch(r'\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?', args.version):
        parser.error('Use a semantic version such as 0.1.0-experimental.1')
    # Only operational roots; repository tests, docs, caches and dependencies never enter the ZIP.
    files = {}
    for p in sorted(SOURCE.rglob('*')):
        rel = p.relative_to(SOURCE)
        if p.is_symlink():
            raise ValueError(f'Symlink not permitted: {rel}')
        if not p.is_file() or '__pycache__' in rel.parts or p.name == '.DS_Store':
            continue
        if rel.parts[0] not in {'SKILL.md', 'frameworks', 'prompts', 'references', 'scripts', 'shared'}:
            raise ValueError(f'Unreviewed source root: {rel}')
        if p.suffix not in {'.md', '.mjs', '.js', '.css', '.html', '.json', '.yaml'}:
            raise ValueError(f'Unreviewed file type: {rel}')
        files[rel.as_posix()] = p.read_bytes()
    original = dict(files)
    text = files['SKILL.md'].decode()
    assert text.startswith('---\nname: pensive\ndescription: ')
    assert len(DESCRIPTION) <= 200
    text, count = re.subn(r'^description: .*$', 'description: ' + DESCRIPTION, text, count=1, flags=re.M)
    assert count == 1
    files['SKILL.md'] = text.encode()
    assert original['SKILL.md'].split(b'---', 2)[2] == files['SKILL.md'].split(b'---', 2)[2]
    blob = archive(files)
    assert blob == archive(files), 'Non-repeatable archive'
    checks = []
    with tempfile.TemporaryDirectory(prefix='pensive-claude-') as tmp:
        temp = Path(tmp).resolve()
        with zipfile.ZipFile(io.BytesIO(blob)) as z:
            assert z.testzip() is None
            assert z.namelist() == ['pensive/' + n for n in sorted(files)]
            z.extractall(temp)
        skill = temp / 'pensive'
        for name, data in files.items():
            assert (skill / name).read_bytes() == data
        links = 0
        for p in skill.rglob('*.md'):
            for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', p.read_text()):
                target = target.split('#')[0]
                if not target or re.match(r'[a-zA-Z]+:', target):
                    continue
                dest = (p.parent / target).resolve()
                assert dest.is_relative_to(skill.resolve()) and dest.is_file(), (p, target)
                links += 1
        checks.append(f'{links} relative Markdown file references resolve within the extracted skill.')
        for framework, script in [('swot', 'swot'), ('pages', 'pages'), ('vpc', 'vpc'), ('five_whys', 'five-whys')]:
            canvas = skill / f'frameworks/{framework}/canvas.html'
            before = canvas.read_bytes()
            command = [args.node, str(skill / f'scripts/package-{script}.mjs')]
            subprocess.run(command, cwd=skill, check=True, capture_output=True)
            assert canvas.read_bytes() == before, f'{framework}: blank rebuild differs'
            state = subprocess.run([args.node, '-e', 'console.log(JSON.stringify(require(process.argv[1]).initialState()))',
                                    str(skill / f'frameworks/{framework}/state.js')], check=True, capture_output=True).stdout
            source = temp / f'{framework}.json'
            source.write_bytes(state)
            output = temp / f'{framework}.html'
            subprocess.run(command + [str(source), str(output)], cwd=temp, check=True, capture_output=True)
            assert output.read_bytes() == before
            refused = subprocess.run(command + [str(source), str(output)], cwd=temp, capture_output=True)
            assert refused.returncode != 0 and output.read_bytes() == before
            source.write_text('{}')
            invalid = temp / f'{framework}-invalid.html'
            rejected = subprocess.run(command + [str(source), str(invalid)], cwd=temp, capture_output=True)
            assert rejected.returncode != 0 and not invalid.exists()
            checks.append(f'{framework}: isolated blank rebuild, valid JSON packaging, overwrite refusal and invalid-state rejection passed.')
    for name, data in original.items():
        assert (SOURCE / name).read_bytes() == data, f'Source changed: {name}'
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    artifact = output_dir / f'pensive-claude-v{args.version}.zip'
    artifact.write_bytes(blob)
    report = ['# Claude distribution local validation', '', 'Experimental candidate; no upload, release or Claude.ai runtime test performed.', '',
              f'Artifact: `{artifact.name}`', f'ZIP SHA-256: `{sha(blob)}`', f'Files: {len(files)}; bytes: {len(blob)}.', '',
              '## Checks', '', '- Exact single `pensive/` ZIP root, CRC, sorted inventory, fixed timestamps/modes, repeat-build byte equality and isolated extraction passed.',
              '- Required name/description metadata checked; description limited to 200 characters.',
              '- SKILL.md body and every other included file match source bytes. Source bytes unchanged after build.',
              '- Only adaptation: shortened build-copy description. No runtime dependencies added.',
              *['- ' + c for c in checks], '', '## Inventory', '', '| ZIP entry | Bytes | SHA-256 |', '| --- | ---: | --- |']
    report += [f'| pensive/{name} | {len(data)} | {sha(data)} |' for name, data in sorted(files.items())]
    artifact.with_suffix('.validation.md').write_text('\n'.join(report) + '\n')
    print(f'Built and locally validated {artifact} ({len(files)} files; SHA-256 {sha(blob)})')

if __name__ == '__main__':
    main()
