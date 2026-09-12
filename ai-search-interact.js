const $=(s)=>document.querySelector(s);
const AUDIT_API='https://yqzxoiogkylgbmaftesv.supabase.co/functions/v1/geo-free-audit';
const state={url:'',audit:null};
const labels={identity:'会社情報',service_clarity:'サービス説明',crawl_basics:'クロール基本',machine_readable:'構造化データ',answer_ready:'FAQ・回答情報'};
function chat(role,text){const box=$('#guideChat');const el=document.createElement('div');el.className=`guideMsg ${role}`;el.textContent=text;box.appendChild(el);box.scrollTop=box.scrollHeight;}
function setReply(text){const el=$('#guideReply');if(el)el.textContent=text;}
function validUrl(text){try{const u=new URL(String(text||'').trim());return /^https?:$/.test(u.protocol)?u.href:''}catch(_){return''}}
function answerFaq(t){t=String(t||'');if(/料金|価格|有料/.test(t))return'詳細版は先着10社9,800円、通常29,800円を予定しています。3AI×12問＝36観測で競合・引用元・誤情報まで確認します。';if(/競合|比較/.test(t))return'無料版はWebサイト側の準備度です。詳細版ではChatGPT・Gemini・Perplexityの実回答で競合比較まで行います。';if(/何が分か|わかる|内容/.test(t))return'無料で、会社情報・サービス説明・クロール基本・構造化データ・FAQ/回答情報の5項目と、優先改善点が分かります。';return'';}
function componentHtml(k,v){const pct=Math.max(0,Math.min(100,(Number(v)||0)*5));return `<div class="auditMetric"><div><b>${labels[k]||k}</b><strong>${v}/20</strong></div><span><i style="width:${pct}%"></i></span></div>`;}
function renderAudit(d){state.audit=d;$('#auditResult').classList.remove('hidden');$('#auditScore').textContent=d.score==null?'--':`${d.score}/100`;$('#auditGrade').textContent=d.grade||'採点できませんでした';$('#auditDomain').textContent=d.final_url||state.url;$('#auditMetrics').innerHTML=Object.entries(d.components||{}).map(([k,v])=>componentHtml(k,v)).join('');$('#auditRecommendations').innerHTML=(d.recommendations||[]).map((x,i)=>`<li><b>${i+1}</b><span>${x}</span></li>`).join('')||'<li><span>大きな不足は検出されませんでした。</span></li>';$('#auditDisclosure').textContent=d.disclosure||'';$('#auditResult').scrollIntoView({behavior:'smooth',block:'start'});}
async function runAudit(text){const u=validUrl(text);if(!u){chat('ai','https:// から始まる公開URLを貼り付けてください。');return;}state.url=u;chat('user',u);chat('ai','公開Webを取得して5項目を確認しています。少しお待ちください。');const b=$('#guideAskBtn');b.disabled=true;b.textContent='診断中…';setReply('会社情報・サービス説明・クロール・構造化データ・FAQを確認中です。');
 try{const r=await fetch(AUDIT_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:u})});const d=await r.json();if(!r.ok)throw new Error(d.detail||d.error||'診断に失敗しました');$('#urlSummary').textContent=`URL：${d.final_url||u}`;chat('ai',d.score==null?'今回は安全に取得できなかったため採点していません。':`診断完了です。準備度は ${d.score}/100、${d.grade} です。下に内訳と優先改善点を表示しました。`);renderAudit(d);setReply('無料結果を確認してください。詳細版では3AI×12問の実観測まで行います。');}
 catch(e){chat('ai',`診断できませんでした：${e.message}`);setReply('URLの公開状態を確認して、もう一度お試しください。');}
 finally{b.disabled=false;b.textContent='無料診断する';}}
function handle(text){const t=String(text||'').trim();if(!t){chat('ai','会社の公開URLを貼り付けてください。');return;}if(!state.audit){const faq=answerFaq(t);if(faq&&!validUrl(t)){chat('user',t);chat('ai',faq);return;}runAudit(t);return;}chat('user',t);chat('ai',answerFaq(t)||'無料診断はWeb準備度です。詳細版ではChatGPT・Gemini・Perplexityの実回答を36観測して比較します。');}
window.addEventListener('DOMContentLoaded',()=>{
 $('#guideAskBtn')?.addEventListener('click',()=>handle($('#guideQuestion')?.value));
 $('#guideQuestion')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();handle(e.currentTarget.value);}});
 document.querySelectorAll('[data-guide]').forEach(b=>b.addEventListener('click',()=>handle(b.dataset.guide)));
 $('#paidCta')?.addEventListener('click',e=>{if(e.currentTarget.getAttribute('aria-disabled')==='true'){e.preventDefault();setReply('詳細版は3AIの本番接続確認後に受付開始します。無料結果は今すぐ利用できます。');}});
});
