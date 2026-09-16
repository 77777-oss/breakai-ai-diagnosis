(()=>{
  'use strict';
  if(window.__BREAKAI_UNIVERSAL_VOICE_NAV__) return;
  window.__BREAKAI_UNIVERSAL_VOICE_NAV__=true;
  const COMMAND='https://command.breakai-labs.co.jp/';
  const KEY='breakai.universalVoice.enabled';
  const q=new URLSearchParams(location.search);
  const launchVoice=q.get('breakai_voice')==='1';
  if(launchVoice){
    try{sessionStorage.setItem(KEY,'1')}catch(_){ }
    q.delete('breakai_voice');
    const clean=location.pathname+(q.toString()?`?${q}`:'')+location.hash;
    try{history.replaceState(history.state,'',clean)}catch(_){ }
  }
  const host=document.createElement('div');
  host.id='breakai-universal-nav';
  host.style.cssText='position:fixed;left:max(10px,env(safe-area-inset-left));bottom:max(10px,env(safe-area-inset-bottom));z-index:2147483647;pointer-events:auto';
  const sh=host.attachShadow({mode:'open'});
  sh.innerHTML=`<style>
    :host{all:initial}*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans JP",sans-serif}
    .box{display:flex;align-items:center;gap:6px;padding:7px;border:1px solid rgba(85,230,255,.38);border-radius:18px;background:rgba(2,15,35,.92);box-shadow:0 10px 30px rgba(0,0,0,.36);backdrop-filter:blur(14px);color:#ecfeff;max-width:min(96vw,650px)}
    button{height:40px;min-width:42px;border:1px solid rgba(99,221,255,.30);border-radius:12px;background:rgba(7,39,67,.90);color:#ecfeff;font-weight:800;font-size:13px;padding:0 11px;cursor:pointer;white-space:nowrap}
    button:hover{border-color:#6cecff;background:rgba(14,67,104,.96)}button:focus-visible{outline:2px solid #6cecff;outline-offset:2px}
    #mic[data-live="1"]{background:linear-gradient(135deg,#137f9d,#1765c1);box-shadow:0 0 18px rgba(74,222,255,.3)}
    #status{display:none;max-width:250px;font-size:11px;line-height:1.35;color:#b9e9f5;padding:0 5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .box[data-wide="1"] #status{display:block}
    @media(max-width:760px){.box{gap:4px;padding:6px;border-radius:16px}button{height:42px;min-width:42px;padding:0 9px;font-size:12px}#status{max-width:120px}.desktop-label{display:none}}
  </style><div class="box" id="box"><button id="back" title="戻る">←<span class="desktop-label"> 戻る</span></button><button id="forward" title="進む">→<span class="desktop-label"> 進む</span></button><button id="home" title="司令塔へ戻る">⌂ 司令塔</button><button id="mic" title="音声操作">🎤 音声</button><span id="status" aria-live="polite">音声待機</span></div>`;
  document.documentElement.appendChild(host);
  const $=s=>sh.querySelector(s), box=$('#box'), mic=$('#mic'), status=$('#status');
  const show=(text,wide=true)=>{status.textContent=String(text||'').slice(0,90);box.dataset.wide=wide?'1':'0';clearTimeout(show.t);show.t=setTimeout(()=>{box.dataset.wide='0'},4200)};
  const toCommand=(query='')=>{
    const u=new URL(COMMAND);
    if(query)u.searchParams.set('voice_query',query);
    u.searchParams.set('voice_from',location.href.slice(0,800));
    if(window.top!==window.self){try{window.top.location.assign(u.toString());return}catch(_){ }}location.assign(u.toString());
  };
  $('#back').onclick=()=>{show('戻ります'); if(history.length>1)history.back();else toCommand()};
  $('#forward').onclick=()=>{show('進みます'); history.forward()};
  $('#home').onclick=()=>{show('司令塔へ戻ります');toCommand()};

  const normalize=t=>String(t||'').replace(/[\s　]+/g,'').replace(/指令塔|司令棟|司令等/g,'司令塔').replace(/ファイナンシャルシステム|ファイナンスシステム|金融システム/g,'FinancialAI');
  const dangerous=/削除|消去|送信|決済|支払|購入|発注|本番反映|デプロイ|公開|投稿|保存|登録|実行|開始|停止|オン|オフ|ON|OFF/i;
  function visible(el){const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>2&&r.height>2&&s.display!=='none'&&s.visibility!=='hidden'&&s.pointerEvents!=='none'}
  function clickVisible(text){
    let target=String(text||'').replace(/を?(開いて|開く|見せて|表示して|押して|選んで|選択して|移動して|行って|ひらいて)$/,'').trim();
    target=target.replace(/^(画面|メニュー|タブ)/,'').trim();
    if(!target||target.length<2||dangerous.test(target))return false;
    const nodes=[...document.querySelectorAll('nav a,nav button,a,[role="tab"],[role="menuitem"],[data-view],button')].filter(visible);
    let best=null,score=0;
    for(const el of nodes){const label=(el.innerText||el.textContent||el.getAttribute('aria-label')||'').replace(/\s+/g,'').trim();if(!label||dangerous.test(label))continue;const a=normalize(label),b=normalize(target);let s=0;if(a===b)s=100;else if(a.includes(b))s=80-b.length/100;else if(b.includes(a)&&a.length>=2)s=60+a.length/100;if(s>score){score=s;best=el}}
    if(best&&score>=60){best.click();show(`${(best.innerText||best.textContent||target).trim()}へ移動`);return true}return false;
  }
  function command(raw){
    const text=String(raw||'').trim(), n=normalize(text); if(!n)return false;
    show(`認識: ${text}`);
    if(/音声(停止|やめ|終了)|マイク(停止|オフ)/.test(n)){stop();return true}
    if((n.includes('司令塔')&&(n.includes('戻')||n.includes('開')||n.includes('行')||n.includes('ホーム'))) || /^(司令塔|ホーム)$/.test(n)){toCommand();return true}
    if(/前の画面|一つ戻|ひとつ戻|戻って|戻る|バック/.test(n)){if(history.length>1)history.back();else toCommand();return true}
    if(/次の画面|一つ進|ひとつ進|進んで|進む|フォワード/.test(n)){history.forward();return true}
    if(/一番上|最上部|トップへ/.test(n)){scrollTo({top:0,behavior:'smooth'});return true}
    if(/一番下|最下部|下まで/.test(n)){scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'});return true}
    if(/下にスクロール|下へスクロール|下を見/.test(n)){scrollBy({top:Math.round(innerHeight*.72),behavior:'smooth'});return true}
    if(/上にスクロール|上へスクロール|上を見/.test(n)){scrollBy({top:-Math.round(innerHeight*.72),behavior:'smooth'});return true}
    if(/更新して|再読み込み|リロード/.test(n)){location.reload();return true}
    const systemOpen=/(SCOUTER|スカウター|MATCH|マッチ|FIX|フィックス|AIKANO|アイカノ|CareMemory|ケアメモリー|BreakAIPlatform|プラットフォーム|FinancialAI|ファイナンシャル(?:AI|システム)|金融システム|BusinessNetwork|ビジネスネットワーク|自走収益工場|自動収益工場|GEO|ジオ|AEO|エーイーオー).*(開いて|開く|行って|移動して|見せて)/i.test(n);
    if(systemOpen){show('司令塔経由でシステムを開きます');setTimeout(()=>toCommand(text),120);return true}
    if(clickVisible(text))return true;
    if(/調べ|検索|教え|まとめ|確認|分析|おすすめ|候補|助成金|補助金|状況/.test(n)){show('司令塔AIで調べます');setTimeout(()=>toCommand(text),180);return true}
    show(`「${text}」を認識しました。画面名＋「開いて」、または「司令塔に戻って」と話せます。`);return false;
  }

  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  let rec=null,enabled=false,restartTimer=null;
  function setState(on,label){enabled=on;mic.dataset.live=on?'1':'0';mic.textContent=on?'🎙 音声中':'🎤 音声';mic.title=label||'音声操作';}
  function stop(){enabled=false;try{sessionStorage.setItem(KEY,'0')}catch(_){ }clearTimeout(restartTimer);try{rec?.stop()}catch(_){ }setState(false);show('音声操作を停止しました')}
  function start(fromAuto=false){
    if(!SR){setState(false);show('このブラウザは音声操作に未対応です。手動ボタンは使えます。');return}
    enabled=true;try{sessionStorage.setItem(KEY,'1')}catch(_){ }
    if(!rec){
      rec=new SR();rec.lang='ja-JP';rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=5;
      rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(!r.isFinal)continue;let best=r[0]?.transcript||'';for(let j=0;j<r.length;j++){const t=r[j]?.transcript||'';if(/司令塔|戻|進|開|スクロール|調べ|検索|Financial|ファイナンシャル|スカウター|MATCH|マッチ/i.test(t)){best=t;break}}command(best)}};
      rec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){enabled=false;setState(false);show('マイク許可が必要です。🎤音声を押してください。');return}if(e.error!=='no-speech')show(`音声再接続: ${e.error}`)};
      rec.onend=()=>{if(enabled){clearTimeout(restartTimer);restartTimer=setTimeout(()=>{try{rec.start()}catch(_){ }},180)}};
    }
    setState(true);show(fromAuto?'音声操作を引き継ぎました':'音声操作を開始しました');
    try{rec.start()}catch(_){ }
  }
  mic.onclick=()=>enabled?stop():start(false);
  let persisted=false;try{persisted=sessionStorage.getItem(KEY)==='1'}catch(_){ }
  if(launchVoice||persisted)setTimeout(()=>start(true),500);
  window.BreakAIVoiceNav={start,stop,command,toCommand};
})();
