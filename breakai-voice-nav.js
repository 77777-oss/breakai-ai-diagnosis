(()=>{
  'use strict';
  if(window.__BREAKAI_UNIVERSAL_VOICE_NAV__) return;
  window.__BREAKAI_UNIVERSAL_VOICE_NAV__=true;
  const COMMAND='https://command.breakai-labs.co.jp/';
  const COMMAND_ORIGIN='https://command.breakai-labs.co.jp';
  const KEY='breakai.universalVoice.enabled';
  const TOKEN_KEY='breakai.connectedVoice.token';
  const PROJECT_KEY='breakai.connectedVoice.project';
  const HAND_KEY='breakai.universalHand.enabled';
  const MP_BASE=COMMAND_ORIGIN+'/connected-assets/mediapipe';
  const CHAT_KEY_PREFIX='breakai.connectedConversation.';
  const VOICE_HOME_PHRASE='司令塔に戻って';
  const q=new URLSearchParams(location.search);
  const fragment=new URLSearchParams(location.hash.replace(/^#/,''));
  const hashVoice=fragment.get('breakai_voice')==='1';
  const launchVoice=q.get('breakai_voice')==='1'||hashVoice;
  const incomingToken=String(fragment.get('breakai_voice_token')||q.get('breakai_voice_token')||'').trim();
  const incomingProject=String(q.get('breakai_voice_project')||fragment.get('breakai_voice_project')||'').trim();
  const incomingHand=q.get('breakai_hand')==='1'||fragment.get('breakai_hand')==='1';
  if(launchVoice){
    try{sessionStorage.setItem(KEY,'1');if(incomingToken)sessionStorage.setItem(TOKEN_KEY,incomingToken);if(incomingProject)sessionStorage.setItem(PROJECT_KEY,incomingProject);if(incomingHand)sessionStorage.setItem(HAND_KEY,'1')}catch(_){ }
    q.delete('breakai_voice');q.delete('breakai_voice_token');q.delete('breakai_voice_project');q.delete('breakai_hand');
    fragment.delete('breakai_voice');fragment.delete('breakai_voice_token');fragment.delete('breakai_voice_project');fragment.delete('breakai_hand');
    const cleanHash=fragment.toString()?`#${fragment}`:'';
    const clean=location.pathname+(q.toString()?`?${q}`:'')+cleanHash;
    try{history.replaceState(history.state,'',clean)}catch(_){ }
  }
  let persisted=false,handPersisted=incomingHand,voiceToken=incomingToken,projectId=incomingProject;
  try{persisted=sessionStorage.getItem(KEY)==='1';handPersisted=handPersisted||sessionStorage.getItem(HAND_KEY)==='1';voiceToken=voiceToken||sessionStorage.getItem(TOKEN_KEY)||'';projectId=projectId||sessionStorage.getItem(PROJECT_KEY)||''}catch(_){ }
  if(!launchVoice&&!persisted)return;

  const host=document.createElement('div');host.id='breakai-universal-nav';
  host.style.cssText='position:fixed;left:max(10px,env(safe-area-inset-left));bottom:max(10px,env(safe-area-inset-bottom));z-index:2147483647;pointer-events:auto';
  const sh=host.attachShadow({mode:'open'});
  sh.innerHTML=`<style>
    :host{all:initial}*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans JP",sans-serif}
    .box{display:flex;align-items:center;gap:6px;padding:7px;border:1px solid rgba(85,230,255,.38);border-radius:18px;background:rgba(2,15,35,.94);box-shadow:0 10px 30px rgba(0,0,0,.40);backdrop-filter:blur(14px);color:#ecfeff;max-width:min(96vw,700px)}
    button{height:40px;min-width:42px;border:1px solid rgba(99,221,255,.30);border-radius:12px;background:rgba(7,39,67,.92);color:#ecfeff;font-weight:800;font-size:13px;padding:0 11px;cursor:pointer;white-space:nowrap}
    button:hover{border-color:#6cecff;background:rgba(14,67,104,.98)}button:focus-visible{outline:2px solid #6cecff;outline-offset:2px}
    #mic[data-live="1"]{background:linear-gradient(135deg,#137f9d,#1765c1);box-shadow:0 0 18px rgba(74,222,255,.35)}
    #mic[data-mode="precision"]::after{content:' 高精度';font-size:9px;color:#bdf7ff}
    #hand[data-live="1"]{background:linear-gradient(135deg,#08706f,#158b71);box-shadow:0 0 18px rgba(66,255,208,.28)}
    #hand-pointer{position:fixed;z-index:2147483647;width:30px;height:30px;border:2px solid #6ef3ff;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 0 0 5px rgba(75,230,255,.12),0 0 20px rgba(75,230,255,.6);display:none}
    #hand-pointer.live{display:block}#hand-pointer.pinch{background:rgba(95,255,207,.5);border-color:#8fffd7;transform:translate(-50%,-50%) scale(.72)}
    #hand-pointer.blocked{border-color:#ff9c9c;box-shadow:0 0 0 5px rgba(255,90,90,.12)}
    #status{display:none;max-width:290px;font-size:11px;line-height:1.35;color:#b9e9f5;padding:0 5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .box[data-wide="1"] #status{display:block}
    #chat[data-live="1"]{background:linear-gradient(135deg,#3d478d,#256c9c);border-color:#85e8ff}
    #conversation{position:fixed;left:0;bottom:58px;width:min(430px,calc(100vw - 20px));max-height:min(62vh,620px);display:none;flex-direction:column;border:1px solid rgba(99,221,255,.38);border-radius:18px;background:rgba(2,15,35,.97);box-shadow:0 18px 60px rgba(0,0,0,.5);overflow:hidden;color:#ecfeff}
    #conversation.open{display:flex}.chat-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(99,221,255,.18)}.chat-head b{font-size:13px}.chat-head small{display:block;color:#8dc9d9;font-size:9px;margin-top:2px}.chat-head button{height:34px;min-width:36px;padding:0 9px}.chat-log{padding:10px;overflow:auto;min-height:120px;max-height:380px;display:flex;flex-direction:column;gap:8px}.msg{font-size:12px;line-height:1.55;padding:8px 10px;border-radius:12px;white-space:pre-wrap;word-break:break-word}.msg.user{align-self:flex-end;background:rgba(24,91,129,.72);max-width:88%}.msg.ai{align-self:stretch;background:rgba(12,39,65,.82);border:1px solid rgba(101,218,255,.13)}.msg.system{color:#a9cad4;background:rgba(255,255,255,.04)}.sources{display:flex;flex-direction:column;gap:5px;margin-top:7px}.sources a{display:block;color:#94efff;text-decoration:none;padding:6px 7px;border:1px solid rgba(92,225,255,.18);border-radius:8px;background:rgba(5,41,63,.62);font-size:11px}.chat-form{display:flex;gap:6px;padding:9px;border-top:1px solid rgba(99,221,255,.18)}.chat-form input{min-width:0;flex:1;height:42px;border:1px solid rgba(99,221,255,.24);border-radius:10px;background:#061426;color:#fff;font-size:14px;padding:0 10px;outline:none}.chat-form input:focus{border-color:#6cecff}.chat-form button{height:42px;min-width:64px}.thinking{opacity:.72}
    @media(max-width:760px){.box{gap:4px;padding:6px;border-radius:16px}button{height:42px;min-width:42px;padding:0 9px;font-size:12px}#status{max-width:135px}.desktop-label{display:none}#conversation{width:calc(100vw - 12px);left:-4px;bottom:56px;max-height:66vh}.chat-log{max-height:42vh}.chat-form input{font-size:16px}}
  </style><div class="box" id="box"><button id="back" title="戻る">←<span class="desktop-label"> 戻る</span></button><button id="forward" title="進む">→<span class="desktop-label"> 進む</span></button><button id="home" title="司令塔へ戻る">⌂ 司令塔</button><button id="chat" title="この画面でAIと会話">💬 AI</button><button id="mic" title="音声操作">🎤 音声</button><button id="hand" title="カメラ手操作">🖐 手操作</button><span id="status" aria-live="polite">音声待機</span></div><section id="conversation" aria-label="接続システムAI会話"><div class="chat-head"><div><b id="chat-title">接続システムAI</b><small>この画面のまま相談・検索・比較・詳細確認</small></div><button id="chat-close" title="閉じる">×</button></div><div id="chat-log" class="chat-log" aria-live="polite"></div><form id="chat-form" class="chat-form"><input id="chat-input" autocomplete="off" placeholder="この画面について質問"><button type="submit">送信</button></form></section><div id="hand-pointer" aria-hidden="true"></div><video id="hand-video" muted playsinline style="display:none"></video>`;
  document.documentElement.appendChild(host);
  const $=s=>sh.querySelector(s),box=$('#box'),mic=$('#mic'),chatButton=$('#chat'),conversation=$('#conversation'),chatLog=$('#chat-log'),chatInput=$('#chat-input'),handButton=$('#hand'),handPointer=$('#hand-pointer'),handVideo=$('#hand-video'),status=$('#status');
  const show=(text,wide=true)=>{status.textContent=String(text||'').slice(0,110);box.dataset.wide=wide?'1':'0';clearTimeout(show.t);show.t=setTimeout(()=>{box.dataset.wide='0'},4200)};
  function cleanReturnSource(){try{const src=new URL(location.href);return (src.origin+src.pathname).slice(0,800)}catch(_){return ''}}
  const toCommand=(query='')=>{
    const u=new URL(COMMAND);if(query)u.searchParams.set('voice_query',query);const src=cleanReturnSource();if(src)u.searchParams.set('voice_from',src);if(handEnabled||handPersisted)u.searchParams.set('breakai_hand','1');
    if(window.parent!==window){try{window.parent.postMessage({type:'breakai-nav-request',action:'home',url:u.toString(),projectId},COMMAND_ORIGIN);show('司令塔へ戻ります');return}catch(_){ }}
    location.assign(u.toString())
  };
  $('#back').onclick=()=>{show('戻ります');if(history.length>1)history.back();else toCommand()};
  $('#forward').onclick=()=>{show('進みます');history.forward()};
  $('#home').onclick=()=>{show('司令塔へ戻ります');toCommand()};

  const projectNames={radar:'SCOUTER',ses:'MATCH',verify:'FIX',aikano:'AIKANO',platform:'BreakAI Platform',financial_ai:'Financial AI',auto_revenue:'自走収益工場',geo_aeo:'GEO / AEO',care_memory:'Care Memory',business_network:'Business Network',website:'BreakAI HP'};
  let chatHistory=[],lastSources=[],chatBusy=false,isSpeaking=false,replyAudio=null;
  const chatKey=()=>CHAT_KEY_PREFIX+(projectId||'unknown');
  function loadChat(){try{const v=JSON.parse(sessionStorage.getItem(chatKey())||'[]');if(Array.isArray(v))chatHistory=v.slice(-12)}catch(_){chatHistory=[]}}
  function saveChat(){try{sessionStorage.setItem(chatKey(),JSON.stringify(chatHistory.slice(-12)))}catch(_){ }}
  function openChat(){conversation.classList.add('open');chatButton.dataset.live='1';$('#chat-title').textContent=(projectNames[projectId]||'接続システム')+' AI';renderChat();setTimeout(()=>chatInput.focus(),0)}
  function closeChat(){conversation.classList.remove('open');chatButton.dataset.live='0'}
  function renderChat(){chatLog.innerHTML='';for(const row of chatHistory.slice(-10)){const d=document.createElement('div');d.className='msg '+(row.role==='user'?'user':row.role==='system'?'system':'ai');d.textContent=String(row.content||'');if(row.role!=='user'&&Array.isArray(row.sources)&&row.sources.length){const src=document.createElement('div');src.className='sources';row.sources.slice(0,5).forEach((x,i)=>{const a=document.createElement('a');a.href=String(x.url||'#');a.target='_blank';a.rel='noopener';a.textContent=`${i+1}. ${String(x.title||'公式・参考情報').slice(0,100)}`;src.append(a)});d.append(src)}chatLog.append(d)}chatLog.scrollTop=chatLog.scrollHeight}
  function pushChat(role,content,sources=[]){chatHistory.push({role,content:String(content||'').slice(0,7000),sources:(sources||[]).slice(0,8)});chatHistory=chatHistory.slice(-12);saveChat();renderChat()}
  function sourceIndex(text){const n=String(text||'');const m=n.match(/([1-9１-９])\s*番/);if(!m)return 0;const z='１２３４５６７８９'.indexOf(m[1]);return z>=0?z:Number(m[1])-1}
  function openRememberedSource(text){if(!lastSources.length||!/開いて|開く|公式|ページ/.test(String(text||'')))return false;const i=Math.max(0,Math.min(lastSources.length-1,sourceIndex(text))),src=lastSources[i];if(!src?.url)return false;window.open(src.url,'_blank','noopener');show(`${i+1}番の情報を開きます`);return true}
  function handleConnectedAction(action){if(!action)return;if(action.requires_confirmation){pushChat('system','この操作は外部への影響があるため、司令塔のHuman Gateで確認が必要です。');return}if(action.type==='workspace_back'){history.back();return}if(action.type==='open_workspace'&&action.project_id&&action.project_id!==projectId){toCommand(`${action.project_id}を開いて`);return}}
  async function speakConnected(text){if(!voiceToken||!text||isSpeaking)return;isSpeaking=true;try{const r=await fetch(COMMAND_ORIGIN+'/api/connected-speech',{method:'POST',headers:{'Content-Type':'application/json','X-BreakAI-Voice-Token':voiceToken,'X-BreakAI-Project':projectId},body:JSON.stringify({text:String(text).slice(0,900)}),mode:'cors',cache:'no-store'});if(!r.ok)return;const blob=await r.blob();replyAudio?.pause();replyAudio=new Audio(URL.createObjectURL(blob));await replyAudio.play();await new Promise(res=>{replyAudio.onended=res;replyAudio.onerror=res})}catch(_){ }finally{isSpeaking=false}}
  async function connectedAsk(raw){const text=String(raw||'').trim();if(!text||chatBusy)return false;if(!voiceToken||!projectId){toCommand(text);return true}openChat();const prior=chatHistory.slice(-10);pushChat('user',text);chatBusy=true;show('この画面でAIが確認中…');const wait=document.createElement('div');wait.className='msg ai thinking';wait.textContent='確認しています…';chatLog.append(wait);chatLog.scrollTop=chatLog.scrollHeight;try{const r=await fetch(COMMAND_ORIGIN+'/api/connected-assist',{method:'POST',headers:{'Content-Type':'application/json','X-BreakAI-Voice-Token':voiceToken,'X-BreakAI-Project':projectId},body:JSON.stringify({message:text,history:prior,page:{path:location.pathname+location.search,title:document.title}}),mode:'cors',cache:'no-store'});const d=await r.json().catch(()=>({}));wait.remove();if(!r.ok)throw new Error(d.detail||d.error||'CONNECTED_ASSIST_FAILED');lastSources=Array.isArray(d.sources)?d.sources:[];pushChat('ai',d.reply||'確認結果を表示しました。',lastSources);handleConnectedAction(d.action);show('回答をこの画面に表示しました');void speakConnected(d.speech_text||d.reply||'')}catch(e){wait.remove();pushChat('system',`確認できませんでした: ${String(e.message||e).slice(0,120)}`);show('AI接続を確認してください')}finally{chatBusy=false}return true}
  chatButton.onclick=()=>conversation.classList.contains('open')?closeChat():openChat();$('#chat-close').onclick=closeChat;$('#chat-form').addEventListener('submit',e=>{e.preventDefault();const v=chatInput.value.trim();if(!v)return;chatInput.value='';void connectedAsk(v)});loadChat();if(chatHistory.length)renderChat();
  const normalize=t=>String(t||'').replace(/[\s　]+/g,'').replace(/指令塔|指令等|指令棟|司令棟|司令等|司令東|司令党|司令と|司令塔ー/g,'司令塔').replace(/ファイナンシャルシステム|ファイナンスシステム|金融システム/g,'FinancialAI').replace(/スカター|スカウタ/g,'SCOUTER');
  function navigationIntent(raw){const n=normalize(raw).replace(/[。、,.!！?？・]/g,'');if(!n)return '';if(/^(?:司令塔|ホーム)$/.test(n)||((n.includes('司令塔')||n.includes('ホーム'))&&/(戻|帰|開|行|移動|トップ)/.test(n)))return 'home';if(/前の画面|一つ戻|ひとつ戻|戻って|戻る|バック/.test(n))return 'back';if(/次の画面|一つ進|ひとつ進|進んで|進む|フォワード/.test(n))return 'forward';if(/一番上|最上部|トップへ/.test(n))return 'top';if(/一番下|最下部|下まで/.test(n))return 'bottom';if(/下にスクロール|下へスクロール|下を見/.test(n))return 'scroll_down';if(/上にスクロール|上へスクロール|上を見/.test(n))return 'scroll_up';return ''}
  let lastNavigationIntent='',lastNavigationAt=0;
  function executeNavigationIntent(intent){const now=performance.now();if(!intent)return false;if(intent===lastNavigationIntent&&now-lastNavigationAt<1000)return true;lastNavigationIntent=intent;lastNavigationAt=now;if(intent==='home'){show('司令塔へ戻ります');toCommand();return true}if(intent==='back'){show('戻ります');if(history.length>1)history.back();else toCommand();return true}if(intent==='forward'){show('進みます');history.forward();return true}if(intent==='top'){scrollTo({top:0,behavior:'smooth'});return true}if(intent==='bottom'){scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'});return true}if(intent==='scroll_down'){scrollBy({top:Math.round(innerHeight*.72),behavior:'smooth'});return true}if(intent==='scroll_up'){scrollBy({top:-Math.round(innerHeight*.72),behavior:'smooth'});return true}return false}
  const dangerous=/削除|消去|送信|決済|支払|購入|発注|本番反映|デプロイ|公開|投稿|保存|登録|実行|開始|停止|オン|オフ/i;
  const dangerousToggle=/\b(?:ON|OFF)\b/i;
  function visible(el){const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>2&&r.height>2&&s.display!=='none'&&s.visibility!=='hidden'&&s.pointerEvents!=='none'}
  function clickVisible(text){
    let target=String(text||'').replace(/を?(開いて|開く|見せて|表示して|押して|選んで|選択して|移動して|行って|ひらいて)$/,'').trim();target=target.replace(/^(画面|メニュー|タブ)/,'').trim();
    if(!target||target.length<2||dangerous.test(target)||dangerousToggle.test(target))return false;
    const nodes=[...document.querySelectorAll('nav a,nav button,a,[role="tab"],[role="menuitem"],[data-view],button')].filter(visible);let best=null,score=0;
    for(const el of nodes){const label=(el.innerText||el.textContent||el.getAttribute('aria-label')||'').replace(/\s+/g,'').trim();if(!label||dangerous.test(label)||dangerousToggle.test(label))continue;const a=normalize(label),b=normalize(target);let s=0;if(a===b)s=100;else if(a.includes(b))s=80-b.length/100;else if(b.includes(a)&&a.length>=2)s=60+a.length/100;if(s>score){score=s;best=el}}
    if(best&&score>=60){best.click();show(`${(best.innerText||best.textContent||target).trim()}へ移動`);return true}return false;
  }
  function command(raw){
    const text=String(raw||'').trim(),n=normalize(text);if(!n)return false;show(`認識: ${text}`);
    if(/音声(停止|やめ|終了)|マイク(停止|オフ)/.test(n)){stop();return true}
    const navIntent=navigationIntent(text);if(navIntent)return executeNavigationIntent(navIntent);
    if(/更新して|再読み込み|リロード/.test(n)){show('再読み込みは誤操作防止のため手動ボタンで確認してください');return true}
    const systemOpen=/(SCOUTER|スカウター|MATCH|マッチ|FIX|フィックス|AIKANO|アイカノ|CareMemory|ケアメモリー|BreakAIPlatform|プラットフォーム|FinancialAI|ファイナンシャル(?:AI|システム)|金融システム|BusinessNetwork|ビジネスネットワーク|自走収益工場|自動収益工場|GEO|ジオ|AEO|エーイーオー|BreakAIHP|ホームページ|会社HP|コーポレートサイト|HP).*(開いて|開く|行って|移動して|見せて)/i.test(n);
    if(systemOpen){show('司令塔経由でシステムを開きます');setTimeout(()=>toCommand(text),80);return true}
    if(clickVisible(text))return true;
    if(openRememberedSource(text))return true;
    if(isSpeaking){show('回答中です',false);return true}
    void connectedAsk(text);return true;
  }


  let handEnabled=false,handStarting=false,handStream=null,handLandmarker=null,lastHandVideoTime=-1,handPointerX=innerWidth/2,handPointerY=innerHeight/2,pinchDown=false,lastPinchAt=0,lastPalmX=null,lastPalmAt=0,lastSwipeAt=0;
  const interactiveSelector='button,a[href],[role="button"],[role="tab"],[role="menuitem"],[data-view],input,select,textarea,[tabindex]:not([tabindex="-1"])';
  function targetLabel(el){const ids=String(el?.getAttribute?.('aria-labelledby')||'').trim().split(/\s+/).filter(Boolean);const labelled=ids.map(id=>document.getElementById(id)?.textContent||'').join(' ');return [el?.innerText,el?.textContent,el?.getAttribute?.('aria-label'),el?.getAttribute?.('title'),el?.getAttribute?.('value'),labelled].filter(Boolean).join(' ').replace(/\s+/g,' ').trim()}
  function safeHandTarget(x,y){let el=document.elementFromPoint(x,y);if(!el)return null;el=el.closest?.(interactiveSelector)||null;if(!el||!visible(el))return null;const label=targetLabel(el),tag=String(el.tagName||'').toUpperCase(),type=String(el.getAttribute?.('type')||'').toLowerCase();const formSubmit=(tag==='INPUT'&&['submit','button','image'].includes(type))||(tag==='BUTTON'&&(type==='submit'||(!type&&!!el.closest?.('form'))));const blocked=!label||formSubmit||!!el.closest?.('#approval')||dangerous.test(label)||dangerousToggle.test(label);return {el,blocked,label:label||'重要操作'}}
  function handOpen(lm){return !!(lm?.[8]&&lm?.[12]&&lm?.[16]&&lm?.[20]&&lm?.[6]&&lm?.[10]&&lm?.[14]&&lm?.[18]&&lm[8].y<lm[6].y-.012&&lm[12].y<lm[10].y-.012&&lm[16].y<lm[14].y-.012&&lm[20].y<lm[18].y-.012)}
  function distance(a,b){return Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0))}
  function setHandState(on,label=''){handEnabled=on;handButton.dataset.live=on?'1':'0';handButton.textContent=on?'🖐 手操作中':'🖐 手操作';if(label)show(label)}
  function stopHand(persist=true){handEnabled=false;handStarting=false;handStream?.getTracks().forEach(t=>t.stop());handStream=null;handLandmarker=null;handVideo.srcObject=null;handPointer.className='';lastPalmX=null;pinchDown=false;if(persist){try{sessionStorage.setItem(HAND_KEY,'0')}catch(_){ }}setHandState(false,'手操作を停止しました')}
  function handFrame(){
    if(!handEnabled||!handStream||!handLandmarker)return;
    if(handVideo.readyState>=2&&handVideo.currentTime!==lastHandVideoTime){lastHandVideoTime=handVideo.currentTime;let result=null;try{result=handLandmarker.detectForVideo(handVideo,performance.now())}catch(_){requestAnimationFrame(handFrame);return}
      const lm=result?.landmarks?.[0];if(lm?.[8]){const now=performance.now(),tx=(1-lm[8].x)*innerWidth,ty=lm[8].y*innerHeight;handPointerX+=(tx-handPointerX)*.34;handPointerY+=(ty-handPointerY)*.34;const hit=safeHandTarget(handPointerX,handPointerY);handPointer.className='live'+(hit?.blocked?' blocked':'');handPointer.style.left=`${handPointerX}px`;handPointer.style.top=`${handPointerY}px`;const pinch=distance(lm[4],lm[8])<.052;if(pinch&&!pinchDown&&now-lastPinchAt>650){lastPinchAt=now;handPointer.classList.add('pinch');if(hit?.blocked){show(`「${hit.label||'重要操作'}」は手操作で直接実行しません。手動で確認してください。`)}else if(hit?.el){hit.el.click();show(`${hit.label||'項目'}を選択しました`)} }pinchDown=pinch;
        const palmX=(1-(lm[9]?.x??lm[0]?.x??lm[8].x))*innerWidth,open=handOpen(lm);if(open){if(lastPalmX!=null&&now-lastPalmAt<360&&now-lastSwipeAt>900){const dx=palmX-lastPalmX;if(Math.abs(dx)>Math.max(145,innerWidth*.11)){lastSwipeAt=now;lastPalmX=palmX;lastPalmAt=now;if(dx>0){show('手のスワイプ：戻ります');history.back()}else{show('手のスワイプ：進みます');history.forward()}}}else{lastPalmX=palmX;lastPalmAt=now}}else{lastPalmX=null}
      }else{handPointer.className='';pinchDown=false;lastPalmX=null}
    }
    requestAnimationFrame(handFrame)
  }
  async function startHand(fromAuto=false){if(handEnabled||handStarting)return;handStarting=true;try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});const vision=await import(MP_BASE+'/vision_bundle.mjs');const files=await vision.FilesetResolver.forVisionTasks(MP_BASE+'/wasm');const landmarker=await vision.HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:MP_BASE+'/models/hand_landmarker.task'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.30,minHandPresenceConfidence:.30,minTrackingConfidence:.30});handStream=stream;handLandmarker=landmarker;handVideo.srcObject=stream;await handVideo.play();lastHandVideoTime=-1;handPointerX=innerWidth/2;handPointerY=innerHeight/2;handEnabled=true;try{sessionStorage.setItem(HAND_KEY,'1')}catch(_){ }setHandState(true,fromAuto?'手操作を引き継ぎました。指先で移動、つまむ動作で選択できます。':'手操作を開始しました。指先で移動、つまむ動作で選択できます。');requestAnimationFrame(handFrame)}catch(e){handStream?.getTracks().forEach(t=>t.stop());handStream=null;handLandmarker=null;setHandState(false,e?.name==='NotAllowedError'?'カメラ許可が必要です。🖐手操作を押してください。':'手操作を開始できませんでした。手動操作は引き続き使えます。')}finally{handStarting=false}}
  handButton.onclick=()=>handEnabled?stopHand(true):void startHand(false);

  let enabled=false,restartTimer=null,mediaStream=null,audioContext=null,analyser=null,mediaRecorder=null,chunks=[],voiceStartedAt=0,lastSpeechAt=0,hadSpeech=false,peak=0,precisionBusy=false;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null,navRec=null,navRecRestart=null;
  function handleTranscript(text,source='voice'){const value=String(text||'').trim();if(!value)return false;show(`${source==='spotter'?'音声操作':'認識'}: ${value}`);return command(value)}
  function stopNavigationSpotter(){clearTimeout(navRecRestart);navRecRestart=null;try{navRec?.stop()}catch(_){ }navRec=null}
  function startNavigationSpotter(){if(!SR||navRec||!enabled||!voiceToken)return;try{navRec=new SR();navRec.lang='ja-JP';navRec.continuous=true;navRec.interimResults=true;navRec.maxAlternatives=5;navRec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];for(let j=0;j<r.length;j++){const t=String(r[j]?.transcript||'').trim(),intent=navigationIntent(t);if(intent){executeNavigationIntent(intent);return}}}};navRec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed')stopNavigationSpotter()};navRec.onend=()=>{navRec=null;if(enabled&&voiceToken){clearTimeout(navRecRestart);navRecRestart=setTimeout(startNavigationSpotter,250)}};navRec.start()}catch(_){navRec=null}}
  function setState(on,mode=''){enabled=on;mic.dataset.live=on?'1':'0';mic.dataset.mode=mode;mic.textContent=on?'🎙 音声中':'🎤 音声'}
  function cleanupMedia(){try{mediaRecorder&&mediaRecorder.state!=='inactive'&&mediaRecorder.stop()}catch(_){ }mediaRecorder=null;mediaStream?.getTracks().forEach(t=>t.stop());mediaStream=null;if(audioContext){audioContext.close().catch(()=>{})}audioContext=null;analyser=null}
  function stop(){enabled=false;stopNavigationSpotter();try{sessionStorage.setItem(KEY,'0')}catch(_){ }clearTimeout(restartTimer);try{rec?.stop()}catch(_){ }cleanupMedia();setState(false);show('音声操作を停止しました')}
  async function transcribePrecision(blob,durationMs){
    const endpoint=COMMAND_ORIGIN+'/api/connected-transcribe';
    const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':blob.type||'audio/webm','X-BreakAI-Voice-Token':voiceToken,'X-BreakAI-Project':projectId,'X-BreakAI-Audio-Ms':String(durationMs)},body:blob,mode:'cors',cache:'no-store'});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'TRANSCRIBE_FAILED');return String(d.text||'').trim();
  }
  function monitorPrecision(){
    if(!enabled||!mediaRecorder||mediaRecorder.state!=='recording'||!analyser)return;const a=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(a);let sum=0;for(const v of a){const x=(v-128)/128;sum+=x*x}const rms=Math.sqrt(sum/a.length),now=performance.now();peak=Math.max(peak,rms);if(rms>.012){hadSpeech=true;lastSpeechAt=now}const e=now-voiceStartedAt;show(hadSpeech?'聞き取り中…':'話しかけてください',false);if((hadSpeech&&e>450&&now-lastSpeechAt>520)||e>5500||(!hadSpeech&&e>3200)){try{mediaRecorder.stop()}catch(_){ }return}requestAnimationFrame(monitorPrecision)
  }
  function beginPrecisionUtterance(){
    if(!enabled||!mediaStream||precisionBusy)return;const type=MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?'audio/webm;codecs=opus':'audio/webm';chunks=[];hadSpeech=false;peak=0;voiceStartedAt=performance.now();lastSpeechAt=voiceStartedAt;mediaRecorder=new MediaRecorder(mediaStream,{mimeType:type});
    mediaRecorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
    mediaRecorder.onstop=async()=>{const durationMs=Math.max(0,Math.round(performance.now()-voiceStartedAt)),heard=hadSpeech,strong=peak>=.008,blob=new Blob(chunks,{type});if(!enabled)return;if(!heard||!strong){setTimeout(beginPrecisionUtterance,80);return}precisionBusy=true;show('高精度認識中…');try{const text=await transcribePrecision(blob,durationMs);if(text)handleTranscript(text,'precision')}catch(e){show('高精度認識を再接続します');if(String(e.message).includes('UNAUTHORIZED')){voiceToken='';try{sessionStorage.removeItem(TOKEN_KEY)}catch(_){ }}}finally{precisionBusy=false;if(enabled)setTimeout(()=>voiceToken?beginPrecisionUtterance():startWebSpeech(true),100)}};
    mediaRecorder.start(100);setState(true,'precision');requestAnimationFrame(monitorPrecision);
  }
  async function startPrecision(fromAuto=false){
    try{mediaStream=mediaStream||await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});const AC=window.AudioContext||window.webkitAudioContext;audioContext=audioContext||new AC();analyser=audioContext.createAnalyser();analyser.fftSize=1024;audioContext.createMediaStreamSource(mediaStream).connect(analyser);setState(true,'precision');show(fromAuto?'高精度音声を引き継ぎました':'高精度音声を開始しました');startNavigationSpotter();beginPrecisionUtterance()}catch(e){if(e?.name==='NotAllowedError'){enabled=false;setState(false);show('マイク許可が必要です。🎤音声を押してください。');return}show('高精度音声を開始できないためブラウザ認識へ切替');startWebSpeech(true)}
  }
  function startWebSpeech(fromAuto=false){
    if(!SR){enabled=false;setState(false);show('このブラウザは音声操作に未対応です。手動ボタンは使えます。');return}enabled=true;try{sessionStorage.setItem(KEY,'1')}catch(_){ }
    if(!rec){rec=new SR();rec.lang='ja-JP';rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=5;rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(!r.isFinal)continue;let best=r[0]?.transcript||'';for(let j=0;j<r.length;j++){const t=r[j]?.transcript||'';if(/司令塔|戻|進|開|スクロール|調べ|検索|Financial|ファイナンシャル|スカウター|MATCH|マッチ/i.test(t)){best=t;break}}handleTranscript(best,'browser')}};rec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){enabled=false;setState(false);show('マイク許可が必要です。🎤音声を押してください。');return}if(e.error!=='no-speech')show(`音声再接続: ${e.error}`)};rec.onend=()=>{if(enabled&&!voiceToken){clearTimeout(restartTimer);restartTimer=setTimeout(()=>{try{rec.start()}catch(_){ }},150)}}}
    setState(true,'browser');show(fromAuto?'音声操作を引き継ぎました':'音声操作を開始しました');try{rec.start()}catch(_){ }
  }
  function start(fromAuto=false){enabled=true;try{sessionStorage.setItem(KEY,'1')}catch(_){ }if(voiceToken&&projectId&&navigator.mediaDevices?.getUserMedia&&window.MediaRecorder){void startPrecision(fromAuto);return}startWebSpeech(fromAuto)}
  mic.onclick=()=>enabled?stop():start(false);
  window.addEventListener('message',e=>{if(e.origin!==COMMAND_ORIGIN||!e.data||e.data.type!=='breakai-nav')return;const a=e.data.action;if(a==='back')history.back();else if(a==='forward')history.forward();else if(a==='home')toCommand();else if(a==='command')command(String(e.data.text||''))});
  try{if(window.parent!==window)window.parent.postMessage({type:'breakai-nav-ready',projectId},COMMAND_ORIGIN)}catch(_){ }
  if(launchVoice||persisted)setTimeout(()=>start(true),350);
  if(handPersisted)setTimeout(()=>void startHand(true),700);
  window.BreakAIVoiceNav={start,stop,command,handleTranscript,navigationIntent,executeNavigationIntent,toCommand,startHand,stopHand,connectedAsk,openChat,closeChat};
})();
