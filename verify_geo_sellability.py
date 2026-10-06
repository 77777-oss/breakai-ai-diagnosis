#!/usr/bin/env python3
from pathlib import Path

R=Path(__file__).resolve().parent
html=(R/"ai-search.html").read_text(encoding="utf-8")
css=(R/"ai-search.css").read_text(encoding="utf-8")
js=(R/"ai-search-interact.js").read_text(encoding="utf-8")
sample=(R/"geo-evidence-sample.html").read_text(encoding="utf-8")
legal=(R/"legal.html").read_text(encoding="utf-8")
privacy=(R/"privacy.html").read_text(encoding="utf-8")
errors=[]

required_html=[
    "AIの比較候補に", "2AI × 12問 = 24観測", "19,800", "原則3営業日",
    "geo-evidence-sample.html", "data-sample-cta", "data-paid-cta",
    "WHO / QUALITY CONTROL", "24 / 24 completeness", "本番サイト変更なし",
    "PDF要約＋24観測一覧（CSV）＋30日実行案", "OpenAI API・Gemini API",
    'id="free-diagnosis"', "納品後7日以内", "24観測の一部が取得できない場合は？",
]
for x in required_html:
    if x not in html: errors.append("main missing: "+x)

if html.count("data-paid-cta") < 4: errors.append("paid CTA coverage too weak")
if "legal.html?from=geo" not in html or "privacy.html?from=geo" not in html:
    errors.append("GEO legal context links missing")

for x in [
    "REAL SELF-OBSERVATION", "8 / 8", "0 / 16", "OWN-SITE CITATIONS",
    "AI・業務改善でおすすめのAI業務支援は？", "BreakAI Labsはどんな会社？",
    "2026-09-13", "gpt-5.6-luna", "gemini-3.8-flash",
    "breakai-labs.co.jp", "30-DAY ACTION EXAMPLE"
]:
    if x not in sample: errors.append("sample missing: "+x)

if "/test_" in html+sample: errors.append("test Stripe URL leaked")
if "geo_diagnostic_start" not in js: errors.append("diagnostic start tracking missing")
if "sample_click" not in js: errors.append("sample CTA tracking missing")
if "paid_click" not in js: errors.append("paid CTA tracking missing")
if "(prefers-reduced-motion:reduce)" not in css and "(prefers-reduced-motion: reduce)" not in css:
    errors.append("reduced-motion support missing")
if "font-size:16px" not in css: errors.append("mobile input 16px protection missing")
if "分析開始の案内を行う前までキャンセル" not in legal:
    errors.append("cancellation boundary missing")
if "原則3営業日以内" not in legal:
    errors.append("delivery timing missing")
if "OpenAI API、Google Gemini API" not in privacy:
    errors.append("AI provider privacy disclosure missing")
if 'href="#diagnose"' in html: errors.append("stale hero anchor leaked")
if "2026-09-14" in html+sample: errors.append("stale evidence date leaked")
if "isPaidReady" not in js: errors.append("mobile paid CTA fail-closed logic missing")
if "from')==='geo'" not in legal or "from')==='geo'" not in privacy:
    errors.append("context-aware back navigation missing")

if "Perplexity" in html+sample+privacy+js:
    errors.append("paused provider leaked: Perplexity")

# Guard against fake scarcity, provider mismatch, or turning observation into a promise.
for stale in ["先着10社","その後29,800円","通常 29,800円"]:
    if stale in html+sample+legal+js: errors.append("stale scarcity/anchor: "+stale)
for bad in ["必ずAIに推薦されます","AI検索1位を保証","売上アップを保証"]:
    if bad in html+sample: errors.append("prohibited guarantee: "+bad)

if errors:
    print("GEO_SELLABILITY_GATE_FAIL")
    for e in errors: print("-",e)
    raise SystemExit(1)

print("GEO_SELLABILITY_GATE_PASS")
print("offer=19800 evidence_sample=REAL_SELF_OBSERVATION paid_cta>=4 legal=GREEN privacy=GREEN")
