const $=(s)=>document.querySelector(s);
const FREE_URL='https://buy.stripe.com/14AeVed2D2M621Ogp91gs05';
const state={company:'',url:'',question:'',recognition:null};
function setReply(text){const el=$('#guideReply');if(el)el.textContent=text;}
function respond(text){const t=(text||'').trim();if(!t)return;
 if(/料金|価格|有料/.test(t))setReply('無料チェックは0円です。まず公開Webの準備度を確認し、必要な場合だけ詳細調査へ進めます。');
 else if(/競合|比較/.test(t))setReply('競合との実AI回答比較は詳細調査で扱います。無料チェックでは、まずWeb側の説明材料を確認します。');
 else if(/ChatGPT|Gemini|Perplexity|AI検索|検索/.test(t))setReply('無料チェックで、AIが会社を理解するための説明材料がWeb上に揃っているか確認できます。');
 else setReply('内容を確認しました。会社名と公開URLを入力して、無料チェックへ進んでください。');
}
function startVoice(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){setReply('このブラウザでは音声入力を使えません。手入力をご利用ください。');return;}
 const r=new SR();state.recognition=r;r.lang='ja-JP';r.interimResults=true;r.continuous=false;const b=$('#voiceGuideBtn');
 r.onstart=()=>{b?.classList.add('listening');if(b)b.textContent='聞いています…';};
 r.onend=()=>{b?.classList.remove('listening');if(b)b.textContent='音声で相談する';};
 r.onerror=()=>setReply('音声をうまく聞き取れませんでした。もう一度話すか、手入力してください。');
 r.onresult=(e)=>{let text='';let final=false;for(let i=e.resultIndex;i<e.results.length;i++){text+=e.results[i][0].transcript;if(e.results[i].isFinal)final=true;}const input=$('#guideQuestion');if(input)input.value=text;if(final){state.question=text;respond(text);}};r.start();}
function proceed(){state.company=$('#guideCompany')?.value.trim()||'';state.url=$('#guideUrl')?.value.trim()||'';state.question=$('#guideQuestion')?.value.trim()||'';
 if(!state.url){setReply('公開WebサイトのURLを入力してください。');$('#guideUrl')?.focus();return;}
 try{const u=new URL(state.url);if(!/^https?:$/.test(u.protocol))throw new Error();}catch(_){setReply('https:// から始まる公開URLを入力してください。');return;}
 sessionStorage.setItem('breakai_ai_search_interest',JSON.stringify({...state,at:new Date().toISOString()}));window.open(FREE_URL,'_blank','noopener');setReply('無料チェック申込画面を開きました。カード入力は不要です。');}
window.addEventListener('DOMContentLoaded',()=>{$('#voiceGuideBtn')?.addEventListener('click',startVoice);$('#guideAskBtn')?.addEventListener('click',()=>respond($('#guideQuestion')?.value));$('#guideProceedBtn')?.addEventListener('click',proceed);$('#guideQuestion')?.addEventListener('keydown',(e)=>{if(e.key==='Enter'){e.preventDefault();respond(e.currentTarget.value);}});});