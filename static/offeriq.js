/* ══════════════════════════════════════════════
   OFFERIQ ENGINE
══════════════════════════════════════════════ */
let offers = [], msgCount = 0;

const AI_WELCOME = [
  "Hello! I'm OfferIQ. I'll help you analyze and rank your job offers.",
  "Fill in the form on the right to add offers — I'll narrate the analysis here.",
];
const AI_RESPONSE_MAP = {
  'ctc':       'CTC is min-max normalized across all offers — highest earns 25 pts, lowest earns 0, others scale proportionally.',
  'growth':    'Growth Potential rated 1–5: Very High=28, High=22, Moderate=15, Low=8, Very Low=2 pts.',
  'work life': 'Work-Life Balance rated 1–5: Excellent=20, Good=16, Average=11, Below Avg=6, Poor=1 pt.',
  'wlb':       'Work-Life Balance rated 1–5: Excellent=20, Good=16, Average=11, Below Avg=6, Poor=1 pt.',
  'layoff':    'Layoff Rate inverse (15 pts max): 0–5%=15, 6–15%=11, 16–30%=7, 31–50%=3, 50%+=1 pt.',
  'bond':      'Bond Duration inverse (10 pts max): 0mo=10, 1–6mo=8, 7–12mo=6, 13–24mo=3, 24+mo=1 pt.',
  'location':  'Location Preference 1–5: Highly Preferred=12, Preferred=9, Neutral=6, Slightly=3, Not Pref=0 pts.',
};
const AI_DEFAULTS = [
  'What company name and CTC should I record for this offer?',
  "What's the growth potential and WLB rating (1–5)?",
  'Fill in the form on the right — the engine will rank it instantly.',
  "Once added, I'll narrate the full score breakdown here.",
];
const WEIGHTS = {
  ctc:              { label: 'CTC',              maxPts: 25, color: 'var(--gold)'    },
  growth_potential: { label: 'Growth Potential', maxPts: 28, color: 'var(--accent3)' },
  wlb:              { label: 'Work-Life Balance', maxPts: 20, color: 'var(--accent)'  },
  layoff_rate:      { label: 'Layoff Rate',       maxPts: 15, color: 'var(--accent2)' },
  bond_duration:    { label: 'Bond Duration',     maxPts: 10, color: '#a0a0c0'        },
  location:         { label: 'Location Pref.',    maxPts: 12, color: 'var(--gold)'    },
};
const GROWTH_S   = { 5:28, 4:22, 3:15, 2:8,  1:2,  0:0 };
const WLB_S      = { 5:20, 4:16, 3:11, 2:6,  1:1,  0:0 };
const LOCATION_S = { 5:12, 4:9,  3:6,  2:3,  1:0,  0:0 };
const LAYOFF_B = [{ max:5,pts:15},{max:15,pts:11},{max:30,pts:7},{max:50,pts:3},{max:100,pts:1}];
const BOND_B   = [{ max:0,pts:10},{max:6, pts:8}, {max:12,pts:6},{max:24,pts:3},{max:999,pts:1}];
const CTC_B    = [{ min:5000000,pts:25},{min:3000000,pts:20},{min:1500000,pts:15},{min:800000,pts:10},{min:300000,pts:5},{min:0,pts:2}];
const RANK_COLORS = ['var(--gold)','var(--accent)','var(--accent3)','var(--muted)','var(--muted)'];

function bMax(v,b){ for(const x of b){ if(v<=x.max) return x.pts; } return b[b.length-1].pts; }
function bMin(v,b){ for(const x of b){ if(v>=x.min) return x.pts; } return b[b.length-1].pts; }

function normCTC(){
  if(!offers.length) return;
  const vals=offers.map(o=>parseFloat(o.ctc)||0);
  const mn=Math.min(...vals), mx=Math.max(...vals);
  offers.forEach(o=>{ const v=parseFloat(o.ctc)||0; o.ctc_score=mx===mn?12:Math.round(((v-mn)/(mx-mn))*25); });
}
function scoreOffer(o){
  let s=0;
  s += o.ctc_score!==undefined ? o.ctc_score : bMin(parseFloat(o.ctc)||0,CTC_B);
  s += GROWTH_S[parseInt(o.growth_potential)]??0;
  s += WLB_S[parseInt(o.wlb)]??0;
  s += bMax(parseFloat(o.layoff_rate)||0,LAYOFF_B);
  s += bMax(parseFloat(o.bond_duration)||0,BOND_B);
  s += LOCATION_S[parseInt(o.location)]??0;
  return Math.min(Math.round(s),100);
}
function explainTop(t){
  const c={'CTC':t.ctc_score??bMin(parseFloat(t.ctc)||0,CTC_B),'Growth':GROWTH_S[parseInt(t.growth_potential)]??0,'WLB':WLB_S[parseInt(t.wlb)]??0,'Layoff Rate':bMax(parseFloat(t.layoff_rate)||0,LAYOFF_B),'Bond':bMax(parseFloat(t.bond_duration)||0,BOND_B),'Location':LOCATION_S[parseInt(t.location)]??0};
  const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0];
  return `"${t.name}" leads primarily due to <strong>${top}</strong>.`;
}

function addMsg(text,type){
  const c=document.getElementById('chatMessages');
  const d=document.createElement('div');
  d.className='msg '+type;
  d.innerHTML=`<div class="msg-icon">${type==='ai'?'IQ':'👤'}</div><div class="msg-bubble">${text}</div>`;
  c.appendChild(d); c.scrollTop=c.scrollHeight;
}
function showTyping(){
  const c=document.getElementById('chatMessages');
  const d=document.createElement('div');
  d.className='msg ai'; d.id='typingMsg';
  d.innerHTML=`<div class="msg-icon">IQ</div><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  c.appendChild(d); c.scrollTop=c.scrollHeight;
}
function removeTyping(){ const el=document.getElementById('typingMsg'); if(el) el.remove(); }

function sendMessage(){
  const inp=document.getElementById('chatInput');
  const val=inp.value.trim(); if(!val) return;
  addMsg(val,'user'); inp.value='';
  setTimeout(showTyping,400);
  setTimeout(()=>{ removeTyping(); const key=Object.keys(AI_RESPONSE_MAP).find(k=>val.toLowerCase().includes(k)); addMsg(key?AI_RESPONSE_MAP[key]:AI_DEFAULTS[msgCount%AI_DEFAULTS.length],'ai'); msgCount++; },1400);
}
function sendQuick(t){ document.getElementById('chatInput').value=t; sendMessage(); }

function addOffer(){
  const o={
    name:document.getElementById('offerName').value.trim(),
    ctc:document.getElementById('ctc').value,
    growth_potential:document.getElementById('growth_potential').value,
    wlb:document.getElementById('wlb').value,
    layoff_rate:document.getElementById('layoff_rate').value,
    bond_duration:document.getElementById('bond_duration').value,
    location:document.getElementById('location').value,
  };
  if(!o.name){ alert('Please enter a company name.'); return; }
  const btn=document.getElementById('analyzeBtn');
  btn.classList.add('loading');
  document.getElementById('analyzeLabel').textContent='Analyzing...';
  setTimeout(()=>{
    offers.push(o); normCTC();
    offers.forEach(x=>{ x.score=scoreOffer(x); });
    offers.sort((a,b)=>b.score-a.score);
    renderRankings();
    const rank=offers.findIndex(x=>x.name===o.name)+1;
    const expl=offers.length===1?explainTop(offers[0]):'';
    addMsg(`"<strong>${o.name}</strong>" added — Score: <strong>${o.score}/100</strong>, Rank #${rank} of ${offers.length}. ${expl}`,'ai');
    showHint(offers.length);
    btn.classList.remove('loading');
    document.getElementById('analyzeLabel').textContent='+ Add & Analyze Offer';
    clearOfferForm(); animateBars();
  },1000);
}
function showHint(n){
  const h=document.getElementById('offerHint'); h.style.display='flex';
  document.getElementById('offerHintText').textContent=n===1?'✓ First offer added! Fill the form again to add another and compare.':`✓ ${n} offers ranked. Add more — rankings update automatically.`;
}
function clearAllOffers(){
  if(!confirm(`Remove all ${offers.length} offer(s)?`)) return;
  offers=[];
  document.getElementById('rankingList').innerHTML='<div class="empty-state">No offers yet — add your first offer above.</div>';
  document.getElementById('resultsMeta').textContent='Awaiting analysis...';
  document.getElementById('offerHint').style.display='none';
  document.getElementById('offerCountBar').style.display='none';
  document.getElementById('clearAllBtn').style.display='none';
  addMsg('All offers cleared.','ai');
}
function clearOfferForm(){
  ['offerName','ctc','layoff_rate','bond_duration'].forEach(id=>{ document.getElementById(id).value=''; });
  ['growth_potential','wlb','location'].forEach(id=>{ document.getElementById(id).value=''; });
}
function renderRankings(){
  const list=document.getElementById('rankingList');
  const meta=document.getElementById('resultsMeta');
  const countBar=document.getElementById('offerCountBar');
  const clrBtn=document.getElementById('clearAllBtn');
  meta.textContent=`${offers.length} offer${offers.length!==1?'s':''} analyzed`;
  if(offers.length>0){ countBar.style.display='flex'; clrBtn.style.display='inline-block'; document.getElementById('offerCount').textContent=offers.length; }
  else { countBar.style.display='none'; clrBtn.style.display='none'; }
  if(!offers.length){ list.innerHTML='<div class="empty-state">No offers yet — add your first offer above.</div>'; return; }
  const GL={5:'Very High',4:'High',3:'Moderate',2:'Low',1:'Very Low'};
  const WL={5:'WLB: Excellent',4:'WLB: Good',3:'WLB: Avg',2:'WLB: Below Avg',1:'WLB: Poor'};
  list.innerHTML=offers.map((o,i)=>{
    const rank=i+1, color=RANK_COLORS[Math.min(i,RANK_COLORS.length-1)];
    const ctcFmt=o.ctc?`₹${Number(o.ctc).toLocaleString('en-IN')}`:'';
    const gl=GL[parseInt(o.growth_potential)]||'', wl=WL[parseInt(o.wlb)]||'';
    return `<div class="offer-rank">
      <div class="rank-num rank-${Math.min(rank,5)}">${rank}</div>
      <div class="rank-info">
        <div class="rank-name">${o.name}</div>
        <div class="rank-tags">
          ${ctcFmt?`<span class="tag tag-green">${ctcFmt}</span>`:''}
          ${gl?`<span class="tag tag-cyan">Growth: ${gl}</span>`:''}
          ${wl?`<span class="tag tag-gold">${wl}</span>`:''}
          ${o.layoff_rate?`<span class="tag tag-orange">Layoff: ${o.layoff_rate}%</span>`:''}
          ${o.bond_duration?`<span class="tag tag-cyan">Bond: ${o.bond_duration}mo</span>`:''}
        </div>
      </div>
      <div class="rank-score">
        <div class="score-val" style="color:${color}">${o.score}</div>
        <div class="score-label">/ 100</div>
        <div class="score-bar"><div class="score-fill" style="background:${color}" data-w="${o.score}"></div></div>
      </div>
    </div>`;
  }).join('');
  setTimeout(animateBars,100);
}
function renderFactorBars(){
  document.getElementById('factorBars').innerHTML=Object.entries(WEIGHTS).map(([,cfg])=>`
    <div class="factor-row">
      <span class="factor-name">${cfg.label}</span>
      <div class="factor-bar-bg"><div class="factor-bar-fill" style="background:${cfg.color}" data-w="${cfg.maxPts}"></div></div>
      <span class="factor-pct" style="color:${cfg.color}">${cfg.maxPts} pts</span>
    </div>`).join('');
}
function animateBars(){ document.querySelectorAll('[data-w]').forEach(el=>{ el.style.width=el.dataset.w+'%'; }); }

const barObs=new IntersectionObserver(entries=>{ entries.forEach(e=>{ if(e.isIntersecting) animateBars(); }); },{threshold:0.2});

document.addEventListener('DOMContentLoaded',()=>{
  AI_WELCOME.forEach(m=>addMsg(m,'ai'));
  renderFactorBars(); renderRankings();
  document.getElementById('chatInput').addEventListener('keydown',e=>{ if(e.key==='Enter') sendMessage(); });
  document.querySelectorAll('.factors-card').forEach(el=>barObs.observe(el));
});
