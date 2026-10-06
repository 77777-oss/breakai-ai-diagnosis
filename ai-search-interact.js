const $=(s)=>document.querySelector(s);
const AUDIT_API='https://yqzxoiogkylgbmaftesv.supabase.co/functions/v1/geo-free-audit';
const FUNNEL_API='https://yqzxoiogkylgbmaftesv.supabase.co/functions/v1/revenue-funnel-event';
const state={url:'',audit:null,inFlight:false,requestSeq:0};
const labels={identity:'会社情報',service_clarity:'サービス説明',crawl_basics:'クロール基本',machine_readable:'構造化データ',answer_ready:'FAQ・回答情報'};
function campaign(){const q=new URLSearchParams(location.search);return{source:q.get('utm_source')||'direct',medium:q.get('utm_medium')||'',campaign:q.get('utm_campaign')||'',content:q.get('utm_content')||''};}
function sessionId(){try{let id=sessionStorage.getItem('breakai_geo_session');if(!id){id=crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;sessionStorage.setItem('breakai_geo_session',id);}return id;}catch(_){return'';}}
function track(event,destination='',metric=null){const c=campaign();return fetch(FUNNEL_API,{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({product:'geo',event,destination,metric,...c,path:location.pathname,session:sessionId()})}).then(r=>{if(!r.ok)console.warn('funnel_event_not_recorded',event,r.status);return r;}).catch(e=>{console.warn('funnel_event_failed',event,e?.message||'unknown');return null;});}
function chat(role,text){const box=$('#guideChat');const el=document.createElement('div');el.className=`guideMsg ${role}`;el.textContent=String(text??'');box.appendChild(el);box.scrollTop=box.scrollHeight;}
function setReply(text){const el=$('#guideReply');if(el)el.textContent=String(text??'');}
function validUrl(text){const raw=String(text||'').trim();if(!raw)return'';const candidate=/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)?raw:`https://${raw}`;try{const u=new URL(candidate);return /^https?:$/.test(u.protocol)&&u.hostname?u.href:''}catch(_){return''}}
function answerFaq(t){t=String(t||'');if(/料金|価格|有料/.test(t))return'詳細版はパイロット価格19,800円の単発診断です。OpenAI・Gemini・Perplexityの3系統×12問＝36観測で競合・引用元・誤情報・AI間差まで確認します。';if(/競合|比較/.test(t))return'無料版はWebサイト側の準備度です。詳細版ではOpenAI API・Gemini API・Perplexity APIの同一質問観測で競合比較まで行います。消費者向けChatGPT画面そのものの再現ではありません。';if(/何が分か|わかる|内容/.test(t))return'無料で、会社情報・サービス説明・クロール基本・構造化データ・FAQ/回答情報の5項目と、優先改善点が分かります。';return'';}
function clear(el){while(el.firstChild)el.removeChild(el.firstChild);}
function renderComponents(components){
  const root=$('#auditMetrics'); clear(root);
  Object.entries(components||{}).forEach(([k,raw])=>{
    const available=raw!==null&&raw!==undefined&&raw!==''&&Number.isFinite(Number(raw));
    const safe=available?Math.max(0,Math.min(20,Number(raw))):0; const pct=safe*5;
    const card=document.createElement('div'); card.className='auditMetric';
    if(!available)card.classList.add('isUnavailable');
    const top=document.createElement('div');
    const name=document.createElement('b'); name.textContent=labels[k]||String(k);
    const score=document.createElement('strong'); score.textContent=available?`${safe}/20`:'--/20';
    top.append(name,score);
    const bar=document.createElement('span'); const fill=document.createElement('i'); fill.style.width=`${pct}%`; bar.appendChild(fill);
    card.append(top,bar); root.appendChild(card);
  });
}
function renderRecommendations(recs,scored){
  const root=$('#auditRecommendations'); clear(root);
  const items=Array.isArray(recs)?recs:[];
  if(items.length){
    items.forEach((value,index)=>{
      const li=document.createElement('li'); const num=document.createElement('b'); const text=document.createElement('span');
      num.textContent=String(index+1); text.textContent=String(value??''); li.append(num,text); root.appendChild(li);
    });
    return;
  }
  const li=document.createElement('li'); const text=document.createElement('span');
  text.textContent=scored?'今回の取得範囲では優先改善候補を特定できませんでした。':'取得できない項目があるため改善候補を判定していません。URLの公開状態を確認して再診断してください。';
  li.appendChild(text); root.appendChild(li);
}
function syncSticky(){const sticky=document.querySelector('.geoMobileSticky');if(!sticky)return;const scored=state.audit?.score!=null&&Number.isFinite(Number(state.audit.score));sticky.classList.toggle('isPaidReady',scored);sticky.classList.toggle('isVisible',window.scrollY>620||scored);}
function renderAudit(d){
  state.audit=d; $('#auditResult').classList.remove('hidden');
  const paidUpsell=document.querySelector('.paidUpsell'); if(paidUpsell)paidUpsell.classList.toggle('hidden',d.score==null);
  const scored=d.score!=null && Number.isFinite(Number(d.score));
  $('#auditScore').textContent=scored?`${Number(d.score)}/100`:'--';
  $('#auditGrade').textContent=scored?String(d.grade||'結果を確認してください'):'採点できませんでした';
  $('#auditDomain').textContent=String(d.final_url||state.url||'');
  renderComponents(d.components); renderRecommendations(d.recommendations,scored);
  $('#auditDisclosure').textContent=String(d.disclosure||'');
  syncSticky();
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  $('#auditResult').scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
}
async function runAudit(text){
  const u=validUrl(text); if(!u){chat('ai','https:// から始まる公開URLを貼り付けてください。');return;}
  if(state.inFlight){setReply('診断中です。完了してから次のURLをお試しください。');return;}
  state.inFlight=true;const requestId=++state.requestSeq;
  state.url=u;state.audit=null;$('#auditResult')?.classList.add('hidden');syncSticky();track('page_view','geo_diagnostic_start');chat('user',u);chat('ai','公開Webを取得して5項目を確認しています。少しお待ちください。');
  const b=$('#guideAskBtn'); b.disabled=true;b.textContent='診断中…';
  setReply('会社情報・サービス説明・クロール・構造化データ・FAQを確認中です。');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const r=await fetch(AUDIT_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:u}),signal:controller.signal});
    const d=await r.json();if(!r.ok)throw new Error(d.detail||d.error||'診断に失敗しました');
    if(requestId!==state.requestSeq)return;
    $('#urlSummary').textContent=`URL：${String(d.final_url||u)}`;
    const scored=d.score!=null && Number.isFinite(Number(d.score));
    chat('ai',scored?`診断完了です。準備度は ${Number(d.score)}/100、${String(d.grade||'結果を確認してください')} です。下に内訳と優先改善点を表示しました。`:'今回は安全に取得できなかったため採点していません。公開状態を確認して再診断してください。');
    renderAudit(d);
    if(scored)track('free_result','geo_free',Number(d.score));
    setReply(scored?'無料結果を確認してください。詳細版では3AI×12問の実観測まで行います。':'今回は有効な診断結果として記録していません。URLを確認して再度お試しください。');
  }catch(e){
    track('page_view',e.name==='AbortError'?'geo_diagnostic_timeout':'geo_diagnostic_error');
    chat('ai',e.name==='AbortError'?'診断に時間がかかっています。時間をおいて、もう一度お試しください。':`診断できませんでした：${e.message}`);
    setReply('URLの公開状態を確認して、もう一度お試しください。');
  }finally{clearTimeout(timer);if(requestId===state.requestSeq){state.inFlight=false;b.disabled=false;b.textContent='無料で確認する →';}}
}
function handle(text){
  const t=String(text||'').trim();if(!t){chat('ai','会社の公開URLを貼り付けてください。');return;}
  const u=validUrl(t);if(u){runAudit(u);return;}
  const faq=answerFaq(t);chat('user',t);chat('ai',faq||'無料診断はWeb準備度です。詳細版ではOpenAI・Gemini・Perplexityの3系統を同一12問で36観測して比較します。別の会社URLを貼れば続けて再診断できます。');
}
window.addEventListener('DOMContentLoaded',()=>{
  track('page_view','geo_landing');
  window.addEventListener('scroll',syncSticky,{passive:true});
  syncSticky();
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
    document.querySelectorAll('video[autoplay]').forEach(v=>{v.pause();v.removeAttribute('autoplay');});
  }
  $('#guideAskBtn')?.addEventListener('click',()=>handle($('#guideQuestion')?.value));
  $('#guideQuestion')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();handle(e.currentTarget.value);}});
  document.querySelectorAll('a[href="#free-diagnosis"]').forEach(a=>a.addEventListener('click',()=>setTimeout(()=>$('#guideQuestion')?.focus({preventScroll:true}),0)));
  document.querySelectorAll('[data-guide]').forEach(b=>b.addEventListener('click',()=>handle(b.dataset.guide)));
  document.querySelectorAll('[data-sample-cta]').forEach(a=>a.addEventListener('click',()=>track('sample_click','geo_evidence_sample')));
  document.querySelectorAll('[data-paid-cta]').forEach(a=>a.addEventListener('click',()=>{track('paid_click','geo_intro_19800');setReply('19,800円のパイロット詳細版へ進みます。会社名・サイトURL・業種・主サービスを確認し、決済後に3AI×12問の観測レポートを作成します。');}));
});
