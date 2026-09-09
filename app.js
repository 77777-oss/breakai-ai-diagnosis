const $=s=>document.querySelector(s);
const state={step:1,industry:'',task:'',minutes:0,weekly:0,rate:.5};
const industries=['建設・施工','不動産','物流','製造','介護','飲食・店舗','士業','EC・小売','人材・採用','事務・バックオフィス','その他'];
const tasks=[
 ['見積もり・提案書',.60],['問い合わせ対応',.55],['メールの仕分け',.60],
 ['報告書・資料作成',.55],['データ入力・転記',.65],['集計・チェック',.45],
 ['日報・記録',.55],['検索・情報収集',.50],['予約・日程調整',.50],['その他',.45]
];
const times=[[5,'5分'],[15,'15分'],[30,'30分'],[60,'1時間'],[120,'2時間以上']];
const freqs=[[15,'1日3回以上'],[5,'ほぼ毎日'],[3,'週3回くらい'],[1.5,'週1〜2回'],[.75,'月に数回']];
const choice=$('#choiceArea'), custom=$('#customArea');
function button(label,fn){const b=document.createElement('button');b.className='choice';b.type='button';b.textContent=label;b.onclick=fn;return b;}
function resetArea(){choice.innerHTML='';custom.innerHTML='';custom.classList.add('hidden');}
function progress(n){state.step=n;$('#stepLabel').textContent=`STEP ${n} / 3`;$('#progressBar').style.width=`${n/3*100}%`;}
function showCustom(placeholder,onDone){custom.classList.remove('hidden');custom.innerHTML=`<input id="customInput" placeholder="${placeholder}"><button id="customDone" class="btn small">次へ</button>`;$('#customDone').onclick=()=>{const v=$('#customInput').value.trim();if(v)onDone(v);};}
function step1(){progress(1);resetArea();$('#question').textContent='あなたの業種は？';$('#hint').textContent='一番近いものを1つ選んでください。';industries.forEach(x=>choice.append(button(x,()=>{if(x==='その他')showCustom('例：清掃業、教育、医療など',v=>{state.industry=v;step2();});else{state.industry=x;step2();}})));}
function step2(){progress(2);resetArea();$('#question').textContent='一番減らしたい仕事は？';$('#hint').textContent='今いちばん面倒なものを1つだけ選んでください。';tasks.forEach(([x,r])=>choice.append(button(x,()=>{state.rate=r;if(x==='その他')showCustom('例：請求書の確認',v=>{state.task=v;step3();});else{state.task=x;step3();}})));}
function step3(){progress(3);resetArea();$('#question').textContent='その仕事、どのくらいやっていますか？';$('#hint').textContent='細かく計算しなくて大丈夫です。近いものを選んでください。';
 const box=document.createElement('div');box.className='answerBlock';box.innerHTML='<h3>1回にかかる時間</h3><div id="timeChoices" class="choices compact"></div><h3>どのくらいの頻度？</h3><div id="freqChoices" class="choices compact"></div><button id="showResult" class="btn full resultBtn" disabled>結果を見る</button>';choice.append(box);
 const t=box.querySelector('#timeChoices'),f=box.querySelector('#freqChoices'),go=box.querySelector('#showResult');
 function selected(parent,b){parent.querySelectorAll('.choice').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');go.disabled=!(state.minutes&&state.weekly);}
 times.forEach(([v,l])=>{const b=button(l,()=>{state.minutes=v;selected(t,b)});t.append(b);});
 freqs.forEach(([v,l])=>{const b=button(l,()=>{state.weekly=v;selected(f,b)});f.append(b);});
 go.onclick=showResult;
}
function showResult(){const before=state.minutes*state.weekly*4/60;const saved=before*state.rate;const after=Math.max(0,before-saved);$('#resultTask').textContent=state.task;$('#savedHours').textContent=`約${saved.toFixed(1)}時間 / 月`;$('#beforeHours').textContent=`約${before.toFixed(1)}時間/月`;$('#afterHours').textContent=`約${after.toFixed(1)}時間/月`;$('#yearHours').textContent=`約${Math.round(saved*12)}時間/年`;$('#nextAction').textContent=`「${state.task}」をまず1つだけ小さく試し、実際に時間が減るか確認します。`;$('#diag').classList.add('hidden');$('#result').classList.remove('hidden');$('#result').scrollIntoView({behavior:'smooth'});}
function wire(id,url){const a=$(id);if(!a)return;if(url){a.href=url;a.target='_blank';a.rel='noopener';}}
$('#restart').onclick=()=>{Object.assign(state,{step:1,industry:'',task:'',minutes:0,weekly:0,rate:.5});$('#result').classList.add('hidden');$('#diag').classList.remove('hidden');step1();$('#diag').scrollIntoView({behavior:'smooth'});};
const c=window.BREAKAI_CONFIG||{};if(c.live&&c.freeIntakeUrl&&c.starterUrl&&c.reportUrl){$('#liveCtas').classList.remove('hidden');wire('#intake',c.freeIntakeUrl);wire('#starter',c.starterUrl);wire('#report',c.reportUrl);}step1();
