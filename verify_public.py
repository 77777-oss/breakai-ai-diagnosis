#!/usr/bin/env python3
from pathlib import Path
R=Path(__file__).resolve().parent
errors=[]
html=(R/'index.html').read_text(encoding='utf-8')
js=(R/'app.js').read_text(encoding='utf-8')
cfg=(R/'config.js').read_text(encoding='utf-8')
alltext=html+js+cfg
if '100→10' in alltext or '100業務' in alltext: errors.append('internal selection logic leaked')
if 'SES Console' in alltext: errors.append('unfinished SES leaked')
if '/test_' in alltext: errors.append('test Stripe link leaked')
if '業種を選ぶ' not in html or '仕事を選ぶ' not in html or '時間を選ぶ' not in html: errors.append('three-step easy UX missing')
if '実質時間単価' in html or 'AI後（分）' in html: errors.append('complex customer inputs remain')
if '実際の効果' not in html: errors.append('disclosure missing')
if '計算の考え方' not in html: errors.append('calculation explanation missing')
if 'id="liveCtas" class="hidden"' not in html: errors.append('prelive paid CTA must be hidden')
if errors:
 print('PUBLIC_GATE_FAIL');[print('-',e) for e in errors];raise SystemExit(1)
print('PUBLIC_GATE_PASS')
