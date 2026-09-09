#!/usr/bin/env python3
from pathlib import Path
R=Path(__file__).resolve().parent
errors=[]
html=(R/'index.html').read_text(encoding='utf-8')
js=(R/'app.js').read_text(encoding='utf-8')
cfg=(R/'config.js').read_text(encoding='utf-8')
if '100→10' in html+js: errors.append('internal 100→10 leaked')
if 'SES Console' in html+js: errors.append('unfinished SES leaked')
if '/test_' in html+js+cfg: errors.append('test Stripe link leaked')
if '気になる業務を3つ' not in html: errors.append('simple UX missing')
if '成果を保証するものではありません' not in html: errors.append('disclosure missing')
if errors:
    print('PUBLIC_GATE_FAIL');[print('-',e) for e in errors];raise SystemExit(1)
print('PUBLIC_GATE_PASS')
