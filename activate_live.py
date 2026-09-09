#!/usr/bin/env python3
import argparse, json, subprocess
from pathlib import Path
R=Path(__file__).resolve().parent

def live_url(x):
    return x.startswith('https://') and '/test_' not in x and 'buy.stripe.com/' in x

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--intake',required=True);p.add_argument('--starter',required=True);p.add_argument('--report',required=True)
    a=p.parse_args()
    urls=[a.intake,a.starter,a.report]
    if not all(map(live_url,urls)):
        raise SystemExit('REFUSE: all URLs must be live Stripe Payment Links')
    cfg=f'''window.BREAKAI_CONFIG={{\n  live:true,\n  freeIntakeUrl:{json.dumps(a.intake)},\n  starterUrl:{json.dumps(a.starter)},\n  reportUrl:{json.dumps(a.report)}\n}};\n'''
    (R/'config.js').write_text(cfg,encoding='utf-8')
    subprocess.run(['git','add','config.js'],cwd=R,check=True)
    subprocess.run(['git','commit','-m','feat: activate live revenue funnel'],cwd=R,check=True)
    subprocess.run(['git','push','origin','main'],cwd=R,check=True)
    print('LIVE_FUNNEL_ACTIVATED')
if __name__=='__main__':main()
