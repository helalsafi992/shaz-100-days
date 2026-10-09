"""Materialize the owner's exact demo correction, without overwriting other source changes."""
from pathlib import Path
import hashlib
import json
root=Path.cwd()
marker=root/'docs/DEMO_PLAN_FLOW_APPLIED.md'
if marker.exists():
    print('Demo flow already materialized; running validation.')
    raise SystemExit(0)
pending=[]
for item in json.loads((root/'scripts/demo-flow-changes.json').read_text()):
    p=root/item['path']
    assert p.resolve().is_relative_to(root.resolve())
    source=p.read_bytes()
    assert hashlib.sha256(source).hexdigest()==item['before'], 'Unexpected source: '+item['path']
    lines=source.decode().splitlines(keepends=True)
    for start,end,text in reversed(item['edits']):
        assert 0<=start<=end<=len(lines)
        lines[start:end]=[text]
    data=''.join(lines).encode()
    assert hashlib.sha256(data).hexdigest()==item['after'], 'Output checksum mismatch: '+item['path']
    pending.append((p,data))
for p,data in pending:p.write_bytes(data)
p=root/'components/GeneratedPlanReview.tsx'
s=p.read_text()
old="if(configuration?.mode==='coach-review'||(configuration&&configuration.mode===undefined))"
assert s.count(old)==1
p.write_text(s.replace(old,"if(configuration?.mode==='coach-review')"))
p=root/'scripts/intake-regression.mts'
s=p.read_text()
old='configuration:{enabled:true,reason:null}'
assert s.count(old)==1
p.write_text(s.replace(old,"configuration:{enabled:true,reason:null,mode:'coach-review'}"))
marker.write_text('# Demo correction applied\n\nValidation is recorded in the workflow, not inferred from this marker.\n')
print('Applied direct demo flow without changing cardio or exercise substitution logic.')
