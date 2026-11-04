"""Focused read-only V2 reference extraction, not required for normal tests.
Run with V2's Jinja-enabled Python -B: script.py /path/to/v2.
Outputs retained helper results and ignored static visual fixtures; no V2 imports/services.
"""
import ast
import json
from collections import defaultdict
from pathlib import Path
import sys
from jinja2 import Environment, FileSystemLoader, select_autoescape

source = Path(sys.argv[1])
functions = {
    '_truncate_side_door_label', '_truncate_overview_text', '_count_tree_nodes',
    '_find_path_to_node', '_node_by_path', '_extend_path_to_preferred_tip',
    '_tree_role_label', '_build_tree_overview', '_derive_tree_strand_and_side_doors',
}
parsed = ast.parse((source / 'app/routes/canvas_pages.py').read_text())
module = ast.Module(body=[n for n in parsed.body if isinstance(n, ast.FunctionDef) and n.name in functions], type_ignores=[])
namespace = {'defaultdict': defaultdict}
exec(compile(module, 'v2-reference-helpers', 'exec'), namespace)
registry = ast.parse((source / 'app/frameworks/registry.py').read_text())
framework = None
for node in ast.walk(registry):
    if isinstance(node, ast.Dict):
        for key, value in zip(node.keys, node.values):
            if isinstance(key, ast.Constant) and key.value == 'five_whys':
                framework = ast.literal_eval(value)
assert framework

def cause(id, text, children=None, output=None):
    return dict(id=id, text=text, children=children or [], is_terminal=output is not None, output=output)

fixtures = [
    dict(name='blank', tree=cause('root', ''), cursor=['root']),
    dict(name='branching', tree=cause('root', 'Observed: invoices arrive late', [
        cause('queue', 'Hypothesis: dispatch queue', [cause('batch', 'Hypothesis: batch processing')]),
        cause('transport', 'Hypothesis: transport delay'),
    ]), cursor=['root', 'queue', 'batch']),
    dict(name='closed', tree=cause('root', 'Observed: service interruption', [
        cause('overload', 'Hypothesis: load exceeds capacity', output='Test a staged capacity adjustment'),
        cause('restart', 'Hypothesis: restart failure', [cause('config', 'Hypothesis: stale configuration')]),
    ]), cursor=['root', 'overload']),
]
output = Path('test-results'); output.mkdir(exist_ok=True)
env = Environment(loader=FileSystemLoader(source / 'templates'), autoescape=select_autoescape(['html']))
css = (source / 'static/css/pensive.css').read_text()
for f in fixtures:
    strand = namespace['_derive_tree_strand_and_side_doors'](tree=f['tree'], cursor=f['cursor'], max_children=3, node_labels=framework['node_labels'])
    overview = namespace['_build_tree_overview'](framework=framework, tree=f['tree'], cursor=f['cursor'])
    f['strand'] = strand
    f['overview'] = overview
    f['navigation'] = {n['id']: namespace['_extend_path_to_preferred_tip'](f['tree'], namespace['_find_path_to_node'](f['tree'], n['id'])) for level in overview['levels'] for n in level}
    tree_view = dict(strand=strand, labels={}, tip_actions=strand[-1] if strand else {})
    strand_html = env.get_template('partials/canvas_tree_strand.html').render(framework=framework, tree_view=tree_view, canvas={'id':'fixture'})
    overview_html = env.get_template('partials/canvas_tree_overview_overlay.html').render(framework=framework, tree_overview=overview, canvas={'id':'fixture'})
    (output / ('five-whys-v2-' + f['name'] + '.html')).write_text('<!doctype html><html lang="en"><meta charset="utf-8"><style>' + css + '\n[x-cloak]{display:none!important}body{padding:40px}</style><body>' + strand_html + overview_html + '</body></html>')
Path('tests/methodology/five-whys-v2-parity.json').write_text(json.dumps(fixtures, indent=2) + '\n')
print('Extracted three V2 helper fixtures and static visual references without importing application services.')
