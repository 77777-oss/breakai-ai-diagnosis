const $=(s)=>document.querySelector(s);
const FREE_URL='https://buy.stripe.com/14AeVed2D2M621Ogp91gs05';
const state={step:'company',company:'',url:'',goal:'',recognition:null,guideAudio:null};
function chat(role,text){const box=$('#guideChat');const el=document.createElement('div');el.className=`guideMsg ${role}`;el.textContent=text;box.appendChild(el);box.scrollTop=box.scrollHeight;}
function setReply(text){const el=$('#guideReply');if(el)el.textContent=text;}
function setInput(ph){const el=$('#guideQuestion');if(el){el.placeholder=ph;el.value='';el.focus();}}
function updateSummary(){
 $('#companySummary').textContent=`会社名：${state.company||'未入力'}`;
 $('#urlSummary').textContent=`URL：${state.url||'未入力'}`;
 $('#guideProceedBtn').disabled=!state.url;
}
function updateProgress(){const items=[...$('#guideProgress').children];items.forEach(x=>x.classList.remove('active','done'));
 const order={company:0,url:1,goal:2,ready:3},n=order[state.step];
 [0,3,6].forEach((idx,i)=>{if(items[idx])items[idx].classList.toggle('done',i<n);if(items[idx+1])items[idx+1].classList.toggle('active',i===n);});
}
function validUrl(text){try{const u=new URL(text);return /^https?:$/.test(u.protocol)?u.toString():'';}catch(_){return '';}}
function extractUrl(text){const m=String(text).match(/https?:\/\/[^\s]+/i);return m?validUrl(m[0]):'';}
function answerFaq(t){
 if(/料金|価格|有料/.test(t))return '無料チェックは0円です。まず公開Webの準備度を確認し、必要な場合だけ詳細調査へ進めます。';
 if(/競合|比較/.test(t))return '競合との実AI回答比較は詳細調査で扱います。無料では、まず会社情報・サービス説明・FAQ・構造化データなどを確認します。';
 if(/何が分か|わかる|AI検索|検索/.test(t))return '無料チェックでは、AIが会社を理解するための説明材料がWeb上に揃っているかを5項目で確認します。';
 return '';
}
function handle(text){const t=String(text||'').trim();if(!t)return;chat('user',t);
 const faq=answerFaq(t);if(faq&&state.step!=='goal'){chat('ai',faq);setReply('質問にはいつでも答えます。続けて診断情報を入力してください。');return;}
 const url=extractUrl(t);
 if(state.step==='company'){
  if(url){state.url=url;state.step='goal';chat('ai','URLを確認しました。会社名はあとで追加できます。次に、いちばん知りたいことを教えてください。');setInput('例：AI検索で自社が見つかるか知りたい');}
  else{state.company=/スキップ|不要|なし/.test(t)?'':t;state.step='url';chat('ai',state.company?`${state.company}ですね。次に、公開WebサイトのURLを教えてください。`:'では会社名は省略します。公開WebサイトのURLを教えてください。');setInput('https://example.com');}
 }else if(state.step==='url'){
  const u=url||validUrl(t);if(!u){chat('ai','URLを確認できませんでした。https:// から始まる公開URLを入力してください。');setReply('非公開URLや管理画面URLは入力しないでください。');return;}
  state.url=u;state.step='goal';chat('ai','ありがとうございます。次に、いちばん知りたいことを教えてください。');setInput('例：ChatGPTで自社が見つかるか知りたい');
 }else if(state.step==='goal'){
  const a=answerFaq(t);state.goal=t;state.step='ready';chat('ai',a?`${a} ${state.company||'御社'}の公開Webを対象に無料チェックへ進めます。準備ができました。`:`${state.company||'御社'}の公開Webを対象に、会社情報・サービス説明・クロール基本・構造化データ・FAQ等を無料で確認できます。準備ができました。`);setReply('内容を確認して「無料チェックへ進む」を押してください。');setInput('追加で聞きたいことがあれば入力してください');
 }else{
  const a=answerFaq(t);chat('ai',a||'追加のご質問も大丈夫です。無料チェックへ進むと、公開Webの準備度を確認できます。');
 }
 updateSummary();updateProgress();
}
function playGuide(){const btn=$('#guideAudioBtn');if(state.guideAudio){state.guideAudio.pause();state.guideAudio=null;if(btn){btn.classList.remove('playing');btn.textContent='音声案内';}return;}const a=new Audio('media/ai-search-guide.mp3');state.guideAudio=a;if(btn){btn.classList.add('playing');btn.textContent='案内中…';}a.onended=a.onerror=()=>{state.guideAudio=null;if(btn){btn.classList.remove('playing');btn.textContent='音声案内';}};a.play().catch(()=>setReply('音声案内を再生できませんでした。もう一度押してください。'));}
function startVoice(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){setReply('このブラウザでは音声入力を使えません。手入力をご利用ください。');return;}
 const r=new SR();state.recognition=r;r.lang='ja-JP';r.interimResults=true;r.continuous=false;const b=$('#voiceGuideBtn');
 r.onstart=()=>{b?.classList.add('listening');if(b)b.textContent='聞いています…';setReply('そのまま話してください。');};
 r.onend=()=>{b?.classList.remove('listening');if(b)b.textContent='🎤 話す';};
 r.onerror=()=>setReply('音声をうまく聞き取れませんでした。もう一度話すか、手入力してください。');
 r.onresult=(e)=>{let text='';let final=false;for(let i=e.resultIndex;i<e.results.length;i++){text+=e.results[i][0].transcript;if(e.results[i].isFinal)final=true;}const input=$('#guideQuestion');if(input)input.value=text;if(final)handle(text);};r.start();}
function proceed(){if(!state.url){chat('ai','先に公開URLを教えてください。');state.step='url';setInput('https://example.com');updateProgress();return;}
 sessionStorage.setItem('breakai_ai_search_interest',JSON.stringify({...state,at:new Date().toISOString()}));window.open(FREE_URL,'_blank','noopener');chat('ai','無料チェック申込画面を開きました。カード入力は不要です。');setReply('別タブに無料申込画面を開きました。');}
function submitCurrent(){const input=$('#guideQuestion');const text=input?.value.trim()||'';if(!text){
 const prompts={company:'会社名を入力するか、「スキップ」と入力してください。',url:'https:// から始まる公開URLを入力してください。',goal:'一番知りたいことを教えてください。',ready:'質問を入力するか、無料チェックへ進んでください。'};
 chat('ai',prompts[state.step]);setReply('入力内容が空でも、次に必要な情報を案内します。');return;}handle(text);}
window.addEventListener('DOMContentLoaded',()=>{
 $('#guideAudioBtn')?.addEventListener('click',playGuide);$('#voiceGuideBtn')?.addEventListener('click',startVoice);$('#guideAskBtn')?.addEventListener('click',submitCurrent);$('#guideProceedBtn')?.addEventListener('click',proceed);
 $('#guideQuestion')?.addEventListener('keydown',(e)=>{if(e.key==='Enter'){e.preventDefault();submitCurrent();}});document.querySelectorAll('[data-guide]').forEach(b=>b.addEventListener('click',()=>{const input=$('#guideQuestion');if(input)input.value=b.dataset.guide;handle(b.dataset.guide);}));
 updateSummary();updateProgress();
});
