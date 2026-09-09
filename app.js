const qs=s=>document.querySelector(s), tasks=qs('#tasks'), tpl=qs('#tpl');
function add(){if(tasks.children.length>=3)return;tasks.append(tpl.content.cloneNode(true));}
for(let i=0;i<3;i++)add();
qs('#add').onclick=add;
function n(el){return Math.max(0,Number(el.value)||0)}
qs('#calc').onclick=()=>{
 const hourly=Math.max(500,n(qs('#hourly'))), rows=[];
 document.querySelectorAll('.task').forEach((x,i)=>{
   const name=x.querySelector('.name').value.trim()||`業務${i+1}`;
   const min=n(x.querySelector('.min')),freq=n(x.querySelector('.freq')),aft=n(x.querySelector('.aft'));
   const before=min*freq*4/60, after=aft*freq*4/60, saved=Math.max(0,before-after);
   rows.push({name,before,after,saved,yen:Math.round(saved*hourly)});
 });
 rows.sort((a,b)=>b.yen-a.yen);
 const B=rows.reduce((s,x)=>s+x.before,0),A=rows.reduce((s,x)=>s+x.after,0),Y=rows.reduce((s,x)=>s+x.yen,0);
 qs('#before').textContent=B.toFixed(1)+'h';qs('#after').textContent=A.toFixed(1)+'h';qs('#saving').textContent='¥'+Y.toLocaleString();
 qs('#ranking').innerHTML=rows.map((x,i)=>`<div class="rank"><b>${i+1}. ${x.name}</b><span>約${x.saved.toFixed(1)}時間/月・¥${x.yen.toLocaleString()}/月</span></div>`).join('');
 qs('#result').classList.remove('hidden');qs('#result').scrollIntoView({behavior:'smooth'});
};
function wire(id,url){const a=qs(id);if(url){a.href=url;a.classList.remove('disabled');a.target='_blank';a.rel='noopener';}else{a.onclick=e=>{e.preventDefault();alert('本番受付の準備中です。');};}}
const c=window.BREAKAI_CONFIG||{};
wire('#intake',c.live&&c.freeIntakeUrl);wire('#starter',c.live&&c.starterUrl);wire('#report',c.live&&c.reportUrl);
