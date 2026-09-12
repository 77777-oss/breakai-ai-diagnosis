const $=(s)=>document.querySelector(s);
const FREE_URL='https://buy.stripe.com/14AeVed2D2M621Ogp91gs05';
const state={url:''};
function chat(role,text){const box=$('#guideChat');const el=document.createElement('div');el.className=`guideMsg ${role}`;el.textContent=text;box.appendChild(el);box.scrollTop=box.scrollHeight;}
function setReply(text){const el=$('#guideReply');if(el)el.textContent=text;}
function validUrl(text){try{const u=new URL(String(text||'').trim());return /^https?:$/.test(u.protocol)?u.href:''}catch(_){return''}}
function answerFaq(text){const t=String(text||'');
 if(/料金|価格|有料/.test(t))return'無料診断は0円です。有料版ではChatGPT・Gemini・Perplexityに各12問、合計36観測して、自社の出現・競合・引用元・誤説明まで比較します。';
 if(/競合|比較/.test(t))return'無料版は自社サイトの準備度、有料版は実際のAI回答で競合比較まで行います。';
 if(/何が分か|わかる|内容/.test(t))return'無料で、①会社の説明が明確か ②サービスが伝わるか ③FAQ・料金・事例の不足 ④robots・sitemap・構造化データ ⑤優先して直す場所、の5項目が分かります。';
 return'';
}
function showValue(url){state.url=url;$('#urlSummary').textContent=`URL：${url}`;$('#guideProceedBtn').disabled=false;
 chat('ai','URLを確認しました。無料診断では次の5つを確認します。\n① 何の会社かAIに伝わるか\n② 誰に何を提供しているか明確か\n③ FAQ・料金・事例など不足情報は何か\n④ robots.txt・sitemap・構造化データは整っているか\n⑤ まず何を直すべきか');
 chat('ai','さらに有料版では、ChatGPT・Gemini・Perplexityへ合計36回実際に質問し、自社が出るか・競合は誰か・何が引用されるか・誤った説明がないかまで比較します。');
 setReply('まず無料で「AIに伝わらない理由」を確認できます。結果を見てから有料調査を検討できます。');
 $('#guideQuestion').value='';$('#guideQuestion').placeholder='追加で聞きたいことがあれば入力';
}
function handle(text){const t=String(text||'').trim();if(!t){chat('ai',state.url?'質問を入力してください。':'会社の公開URLを貼り付けてください。');return;}
 if(!state.url){const u=validUrl(t);if(!u){const faq=answerFaq(t);chat('ai',faq?`${faq} まず公開URLを貼り付けてください。`:'https:// から始まる公開URLを貼り付けてください。');return;}chat('user',t);showValue(u);return;}
 chat('user',t);chat('ai',answerFaq(t)||'無料診断ではWeb側の準備度を確認します。より詳しい実AI回答・競合・引用元の比較は有料版で確認できます。');
}
function proceed(){if(!state.url){setReply('公開URLを貼り付けてください。');return;}sessionStorage.setItem('breakai_ai_search_interest',JSON.stringify({...state,at:new Date().toISOString()}));window.open(FREE_URL,'_blank','noopener');setReply('無料チェック申込画面を開きました。カード入力は不要です。');}
window.addEventListener('DOMContentLoaded',()=>{$('#guideAskBtn')?.addEventListener('click',()=>handle($('#guideQuestion')?.value));$('#guideProceedBtn')?.addEventListener('click',proceed);$('#guideQuestion')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();handle(e.currentTarget.value);}});document.querySelectorAll('[data-guide]').forEach(b=>b.addEventListener('click',()=>handle(b.dataset.guide)));});
