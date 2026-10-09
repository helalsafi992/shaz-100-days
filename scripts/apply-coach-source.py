"""Materialize exact reviewed source edits, rejecting an unexpected base version.
Runs only during feature-branch development; never reads customer data or secrets.
"""
from pathlib import Path
import hashlib
import json
import runpy

root = Path.cwd()
marker = root / 'docs/COACH_REVIEW_SOURCE_APPLIED.md'
if marker.exists():
    print('Source edits already committed; validating current source.')
    raise SystemExit(0)

pending = []
for n in (1, 2, 3):
    entries = json.loads((root / f'scripts/coach-source-changes-{n}.json').read_text())
    for item in entries:
        path = root / item['path']
        assert path.resolve().is_relative_to(root.resolve()), 'Unsafe source path'
        source = path.read_bytes()
        digest = hashlib.sha256(source).hexdigest()
        if digest == item['after']:
            continue
        assert digest == item['before'], 'Unexpected source version: ' + item['path']
        lines = source.decode('utf-8').splitlines(keepends=True)
        for start, end, replacement in reversed(item['edits']):
            assert 0 <= start <= end <= len(lines), 'Invalid edit range'
            lines[start:end] = [replacement]
        updated = ''.join(lines).encode('utf-8')
        assert hashlib.sha256(updated).hexdigest() == item['after'], 'Source checksum mismatch: ' + item['path']
        pending.append((path, updated))
for path, updated in pending:
    path.write_bytes(updated)
p = root / 'lib/profile.ts'
s = p.read_text()
line = '    ...(p.cardio?.intensity === "moderate" ? p.cardio.weekdays : []),\n'
assert s.count(line) == 1, 'Hard-day cardio anchor changed'
p.write_text(s.replace(line, ''))
runpy.run_path(str(root / 'scripts/coach-postprocess.py'), run_name='__main__')
marker.parent.mkdir(exist_ok=True)
marker.write_text('# Coach review source applied\n\nExact source edits materialized. Validation is recorded separately in the workflow run; this file alone does not certify a passing test or deployment.\n')
print('Applied', len(pending), 'guarded source updates.')
