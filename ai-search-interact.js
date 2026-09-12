const $=(s)=>document.querySelector(s);
const FREE_URL='https://buy.stripe.com/14AeVed2D2M621Ogp91gs05';
const state={step:'url',url:'',goal:''};
function chat(role,text){const box=$('#guideChat');const el=document.createElement('div');el.className=`guideMsg ${role}`;el.textContent=text;box.appendChild(el);box.scrollTop=box.scrollHeight;}
function setReply(text){const el=$('#guideReply');if(el)el.textContent=text;}
function extractUrl(text){const m=String(text||'').match(/https?:\/\/[^\s]+/i);if(!m)return'';try{return new URL(m[0]).href}catch(_){return''}}
function validUrl(text){try{const u=new URL(String(text||'').trim());return /^https?:$/.test(u.protocol)?u.href:''}catch(_){return''}}
function answerFaq(text){const t=String(text||'');
 if(/料金|価格|有料/.test(t))return'無料チェックは0円です。詳細なAI実観測や競合比較は、有料調査の対象です。';
 if(/競合|比較/.test(t))return'無料ではWeb側の準備度を確認します。競合との実AI回答比較は詳細調査で扱います。';
 if(/何が分か|わかる|内容/.test(t))return'会社情報・サービス説明・robots.txt・sitemap・構造化データ・FAQなど、AIが理解する材料が公開Webに揃っているか確認します。';
 return'';
}
function updateProgress(){document.querySelectorAll('#guideProgress span,#guideProgress b').forEach(x=>x.classList.remove('active'));const nodes=[...document.querySelectorAll('#guideProgress span,#guideProgress b')];if(state.step==='url'){nodes[0]?.classList.add('active');nodes[1]?.classList.add('active');}else{nodes[2]?.classList.add('active');nodes[3]?.classList.add('active');}}
function updateSummary(){$('#urlSummary').textContent=`URL：${state.url||'未入力'}`;$('#guideProceedBtn').disabled=!(state.url&&state.goal);}
function setInput(ph){const i=$('#guideQuestion');i.value='';i.placeholder=ph;i.focus();}
function handle(text){const t=String(text||'').trim();if(!t){chat('ai',state.step==='url'?'公開URLを貼り付けてください。':'知りたいことを入力してください。');return;}chat('user',t);
 if(state.step==='url'){
  const u=extractUrl(t)||validUrl(t);if(!u){const faq=answerFaq(t);chat('ai',faq?`${faq} まず公開URLを貼り付けてください。`:'URLを確認できませんでした。https:// から始まる公開URLを貼り付けてください。');return;}
  state.url=u;state.step='goal';chat('ai','URLを確認しました。次に、何を知りたいですか？');setInput('例：AI検索で自社が見つかるか知りたい');
 }else if(state.step==='goal'){
  const faq=answerFaq(t);if(faq&&/料金|何が分か|わかる|内容/.test(t)){chat('ai',`${faq} 続けて、診断で一番知りたいことを入力してください。`);return;}
  state.goal=t;state.step='ready';chat('ai',faq?`${faq} この内容で無料チェックへ進めます。`:'この内容で無料チェックへ進めます。準備ができました。');setReply('内容を確認して「無料チェックへ進む」を押してください。');setInput('追加で聞きたいことがあれば入力してください');
 }else{chat('ai',answerFaq(t)||'追加の質問も大丈夫です。準備ができたら無料チェックへ進んでください。');}
 updateSummary();updateProgress();
}
function proceed(){if(!state.url||!state.goal){setReply('公開URLと知りたいことを入力してください。');return;}sessionStorage.setItem('breakai_ai_search_interest',JSON.stringify({...state,at:new Date().toISOString()}));window.open(FREE_URL,'_blank','noopener');setReply('無料チェック申込画面を開きました。カード入力は不要です。');}
window.addEventListener('DOMContentLoaded',()=>{
 $('#guideAskBtn')?.addEventListener('click',()=>handle($('#guideQuestion')?.value));$('#guideProceedBtn')?.addEventListener('click',proceed);
 $('#guideQuestion')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();handle(e.currentTarget.value);}});
 document.querySelectorAll('[data-guide]').forEach(b=>b.addEventListener('click',()=>handle(b.dataset.guide)));
 updateProgress();updateSummary();
});
