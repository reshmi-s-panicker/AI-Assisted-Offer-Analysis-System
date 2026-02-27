/* ══════════════════════════════════════════════
   PLACEMENT ENGINE 2.0
══════════════════════════════════════════════ */
let placementState=null, plannerDay=1, applications=[];

function generateStrategy(){
  const days=parseInt(document.getElementById('sb-days').value)||0;
  const tier=document.getElementById('sb-tier').value;
  const role=document.getElementById('sb-role').value;
  const dsa=parseInt(document.getElementById('sb-dsa').value)||1;
  const sd=parseInt(document.getElementById('sb-sd').value)||1;
  const type=document.getElementById('sb-type').value;
  const ctc=document.getElementById('sb-ctc').value;
  const comm=parseInt(document.getElementById('sb-comm').value)||1;
  const res=parseInt(document.getElementById('sb-resume').value)||1;
  if(!days||!tier||!role){ alert('Please fill in at least: Days Left, Target Tier, and Target Role.'); return; }
  const btn=document.getElementById('sbGenerateBtn');
  btn.classList.add('loading');
  document.getElementById('sbGenerateLabel').textContent='⚡ Generating...';
  setTimeout(()=>{
    placementState=buildPlan(days,tier,role,dsa,sd,comm,res,type,ctc);
    renderMode(placementState); renderRisk(placementState);
    renderRoadmap(placementState); renderReadiness(placementState);
    buildDailyPlan(placementState); updateHeroStats(placementState);
    document.getElementById('placementTabs').style.display='flex';
    switchPTab('roadmap',document.querySelector('.ptab'));
    btn.classList.remove('loading');
    document.getElementById('sbGenerateLabel').textContent='⚡ Regenerate Strategy';
    document.getElementById('modeBanner').scrollIntoView({behavior:'smooth',block:'start'});
  },900);
}

function buildPlan(days,tier,role,dsa,sd,comm,res,type,ctc){
  let mode,modeLabel,modeIcon,modeColor,modeDesc;
  if(days>=90){mode='deep';modeLabel='DEEP PREP MODE';modeIcon='🧠';modeColor='deep';modeDesc=`Based on ${days} days remaining, you are in FULL DEEP PREPARATION MODE. Maximum coverage across all skill areas.`;}
  else if(days>=60){mode='balanced';modeLabel='BALANCED MODE';modeIcon='⚖️';modeColor='balanced';modeDesc=`Based on ${days} days remaining, you are in BALANCED MODE. Strong DSA + key system design + application push.`;}
  else if(days>=30){mode='fast';modeLabel='FAST-TRACK MODE';modeIcon='🚀';modeColor='fast';modeDesc=`Based on ${days} days remaining, you are in FAST-TRACK MODE. Prioritise high-impact prep and start applications immediately.`;}
  else{mode='crash';modeLabel='CRASH MODE';modeIcon='⚠️';modeColor='crash';modeDesc=`Based on ${days} days remaining, you are in CRASH MODE. Revise top patterns, polish resume, hammer applications daily.`;}
  let alloc;
  if(mode==='deep'){alloc={dsa:40,sd:20,core:15,mock:10,resume:5,apply:0};}
  else if(mode==='balanced'){alloc={dsa:Math.round(days*.40),sd:Math.round(days*.17),core:Math.round(days*.10),mock:Math.round(days*.13),resume:Math.round(days*.08),apply:Math.round(days*.12)};}
  else if(mode==='fast'){alloc={dsa:Math.round(days*.45),sd:Math.round(days*.15),core:Math.round(days*.08),mock:Math.round(days*.12),resume:Math.round(days*.08),apply:Math.round(days*.12)};}
  else{alloc={dsa:Math.round(days*.50),sd:0,core:0,mock:Math.round(days*.20),resume:Math.round(days*.15),apply:Math.round(days*.15)};}
  const tierMods={faang:{dsa:+5,sd:+3,mock:+2},product:{dsa:+2,sd:+3,mock:+2,resume:+1},service:{dsa:-2,sd:-3,core:+4,resume:+2},startup:{dsa:-2,sd:+4,mock:+1,resume:+2},government:{dsa:-4,sd:-4,core:+6,resume:+2}};
  const mod=tierMods[tier]||{};
  Object.keys(mod).forEach(k=>{ if(alloc[k]!==undefined) alloc[k]=Math.max(0,alloc[k]+mod[k]); });
  const phases=buildPhases(days,mode,tier,role,dsa,sd,alloc);
  const readiness=buildReadiness(tier,role,dsa,sd,comm,res);
  const risk=calcRisk(days,tier,dsa,sd,readiness.overall);
  const taskPool=buildTaskPool(tier,role,dsa,sd,res,comm);
  return{days,tier,role,dsa,sd,comm,res,type,ctc,mode,modeLabel,modeIcon,modeColor,modeDesc,alloc,phases,readiness,risk,taskPool};
}

function buildPhases(days,mode,tier,role,dsa,sd,alloc){
  const phases=[]; let cursor=1;
  const roleLabel={sde:'SDE','data-analyst':'Data Analyst',ml:'ML Engineer',devops:'DevOps',uiux:'UI/UX',consulting:'Consulting'}[role]||role;
  const tierLabel={faang:'FAANG',product:'Product-Based',service:'Service',startup:'Startup',government:'Govt/PSU'}[tier]||tier;
  if(alloc.dsa>0){
    const dsaLabel=role==='data-analyst'?'SQL & Analytics Sprint':role==='ml'?'ML Foundations Sprint':role==='devops'?'Infrastructure & Cloud Sprint':role==='uiux'?'Portfolio & Design Sprint':role==='consulting'?'Case Study & Aptitude Sprint':dsa<=2?'DSA Foundations Sprint':dsa<=3?'DSA Intermediate Sprint':'DSA Advanced Sprint';
    phases.push({num:phases.length+1,label:`Phase 0${phases.length+1} — High Intensity`,title:dsaLabel,days:`Day ${cursor}–${cursor+alloc.dsa-1}`,start:cursor,end:cursor+alloc.dsa-1,tasks:getDSATasks(role,dsa,tier),tags:['tag-cyan']});
    cursor+=alloc.dsa;
  }
  const sdDays=alloc.sd||0;
  if(sdDays>0){
    phases.push({num:phases.length+1,label:`Phase 0${phases.length+1} — Design & Architecture`,title:role==='sde'||role==='ml'?'System Design Sprint':`${roleLabel} Domain Depth`,days:`Day ${cursor}–${cursor+sdDays-1}`,start:cursor,end:cursor+sdDays-1,tasks:getSDTasks(role,tier,sd),tags:['tag-green']});
    cursor+=sdDays;
  }
  const resDays=(alloc.resume||0)+(alloc.apply||0);
  if(resDays>0&&mode!=='crash'){
    phases.push({num:phases.length+1,label:`Phase 0${phases.length+1} — Outreach`,title:`Resume Polish + ${tierLabel} Outreach`,days:`Day ${cursor}–${cursor+resDays-1}`,start:cursor,end:cursor+resDays-1,tasks:[`Tailor resume for ${tierLabel} ${roleLabel} roles`,'Optimise LinkedIn headline and About section','Send 5–8 referral messages to alumni connections','Apply to 3–5 companies per day via job portals','Build target company list (20–30 companies across tiers)','Follow up on previous applications after 7 days'],tags:['tag-gold']});
    cursor+=resDays;
  }
  const mockDays=alloc.mock||0;
  if(mockDays>0){
    phases.push({num:phases.length+1,label:`Phase 0${phases.length+1} — Mock Execution`,title:'Mock Interview Sprint',days:`Day ${cursor}–${cursor+mockDays-1}`,start:cursor,end:cursor+mockDays-1,tasks:[`Conduct 1 full mock ${roleLabel} interview daily`,'Record yourself — review tone, speed, and structure','Practice 3 STAR answers per session','Time yourself on LeetCode Medium problems (< 25 min)','Simulate system design whiteboard sessions','Get peer feedback or use Pramp / interviewing.io'],tags:['tag-orange']});
    cursor+=mockDays;
  }
  if(mode==='crash'){
    phases.push({num:phases.length+1,label:`Phase 0${phases.length+1} — Rapid Application`,title:'Daily Applications + Revision',days:`Day ${cursor}–${days}`,start:cursor,end:days,tasks:['10+ applications every single day','Revise top 50 LeetCode problems (arrays, DP, graphs)','Polish resume to ATS-ready state today','Send referral messages to every contact you have','Mock interview every evening — no exceptions'],tags:['tag-orange','tag-cyan']});
  }
  return phases;
}

function getDSATasks(role,dsa,tier){
  const base={sde:[dsa<=2?'Arrays, Strings, Hashing (Week 1)':'Sliding Window + Two Pointers patterns',dsa<=2?'Sorting algorithms + Binary Search':'Trees, BST, Trie problems','Recursion + Backtracking problems',dsa<=3?'Stack, Queue, Linked Lists':'Dynamic Programming (Knapsack, LCS, LIS)',tier==='faang'?'Graphs — BFS/DFS/Dijkstra/Union-Find':'Heap + Priority Queue problems',tier==='faang'?'5 LeetCode Hard problems per week':'LeetCode Medium daily (target: 2/day)'],'data-analyst':['SQL Joins, Subqueries, Window Functions','Aggregations, GROUP BY, HAVING patterns','Python pandas — data cleaning and transformation','Excel: PivotTables, VLOOKUP, advanced formulas','Basic statistics: mean, median, std dev, correlation','BI Tools: Tableau or Power BI — build 2 dashboards'],ml:['Python: NumPy, pandas, scikit-learn refresher','Supervised Learning: Linear/Logistic Regression, Decision Trees','Unsupervised Learning: K-Means, PCA','Neural Networks basics + backpropagation intuition','Implement 2 end-to-end ML projects (Kaggle datasets)','ML system design: feature engineering, model serving'],devops:['Linux commands, shell scripting fundamentals','Docker: containers, Dockerfile, docker-compose','Kubernetes: pods, services, deployments','CI/CD pipelines: GitHub Actions or Jenkins','AWS/GCP/Azure: compute, storage, networking basics','Infrastructure as Code: Terraform or Ansible'],uiux:['Build 3 case studies (problem → research → wireframe → test)','Figma: components, auto-layout, prototyping','User research methods: interviews, usability tests','Design principles: hierarchy, contrast, spacing, typography','Mobile-first responsive design patterns','Portfolio site with 3 polished projects live'],consulting:['Case study frameworks: Profitability, Market Entry, M&A','Practice 2 full cases per day (McKinsey/BCG format)','Quantitative aptitude: percentage, ratio, data interpretation','Current affairs and business news (30 min daily)','Guesstimate practice: market sizing questions','STAR stories for leadership and teamwork scenarios']};
  return base[role]||base['sde'];
}
function getSDTasks(role,tier,sd){
  const tasks={sde:[sd<=2?'Understand client-server, REST, HTTP basics':'Design URL Shortener + Pastebin',sd<=2?'Learn about databases: SQL vs NoSQL trade-offs':'Design Twitter feed / Instagram','Caching strategies: Redis, CDN, write-through vs write-back','Load balancing, horizontal vs vertical scaling',tier==='faang'?'Design WhatsApp / Uber / Netflix at scale':'Design a simple e-commerce backend','CAP theorem, eventual consistency, distributed systems basics'],ml:['ML pipeline design: data ingestion → training → serving','Feature stores, model registry, experiment tracking (MLflow)','Real-time vs batch inference patterns','Model monitoring: data drift, concept drift','Vector databases and embedding systems','Design a recommendation system end-to-end'],devops:['Design a CI/CD pipeline for a microservices app','Kubernetes cluster design: HA, auto-scaling, namespaces','Observability stack: Prometheus + Grafana + ELK','Disaster recovery: RTO/RPO, backup strategies','Security: IAM, secrets management, network policies','Cost optimisation in cloud infrastructure']};
  return tasks[role]||tasks['sde'];
}
function buildReadiness(tier,role,dsa,sd,comm,res){
  const dsaPct=Math.min(100,Math.round((dsa/5)*100));
  const sdPct=Math.min(100,Math.round((sd/5)*100));
  const commPct=Math.min(100,Math.round((comm/5)*100));
  const resPct=Math.min(100,Math.round((res/5)*100));
  const weights={sde:{dsa:.35,sd:.25,comm:.20,resume:.20},'data-analyst':{dsa:.15,sd:.10,comm:.30,resume:.45},ml:{dsa:.20,sd:.30,comm:.20,resume:.30},devops:{dsa:.10,sd:.35,comm:.20,resume:.35},uiux:{dsa:.05,sd:.15,comm:.30,resume:.50},consulting:{dsa:.10,sd:.05,comm:.50,resume:.35}}[role]||{dsa:.30,sd:.25,comm:.20,resume:.25};
  const overall=Math.round(dsaPct*weights.dsa+sdPct*weights.sd+commPct*weights.comm+resPct*weights.resume);
  const breakdown=[{label:'DSA / Core Skill',pct:dsaPct,color:'var(--accent)'},{label:'System Design',pct:sdPct,color:'var(--accent3)'},{label:'Communication',pct:commPct,color:'var(--gold)'},{label:'Resume Strength',pct:resPct,color:'var(--accent2)'}];
  const weakest=[...breakdown].sort((a,b)=>a.pct-b.pct)[0];
  return{overall,breakdown,weakest};
}
function calcRisk(days,tier,dsa,sd,readiness){
  let score=0;
  if(days<20) score+=3; else if(days<40) score+=2; else if(days<60) score+=1;
  if(tier==='faang') score+=2; else if(tier==='product') score+=1;
  if(dsa<=2) score+=2; else if(dsa===3) score+=1;
  if(sd<=2&&(tier==='faang'||tier==='product')) score+=2;
  if(readiness<40) score+=2; else if(readiness<60) score+=1;
  if(score>=6) return{level:'high',icon:'🔴',label:'HIGH RISK',text:`High placement risk detected. Days are short, target tier is demanding, and skill gaps are significant. Consider targeting ${tier==='faang'?'Tier 2 Product-Based':'a safer tier'} or doubling daily study hours immediately.`,cls:'risk-high'};
  if(score>=3) return{level:'medium',icon:'🟡',label:'MEDIUM RISK',text:'Manageable risk — but execution matters. Stick to the generated plan daily with no breaks. Weak areas need immediate attention.',cls:'risk-medium'};
  return{level:'low',icon:'🟢',label:'LOW RISK',text:'Strong placement position. You have the time and baseline skills. Stay consistent, apply early, and keep mock interviews regular.',cls:'risk-low'};
}
function buildTaskPool(tier,role,dsa,sd,res,comm){
  const dsaTasks=getDSATasks(role,dsa,tier);
  return{
    dsa:[{tag:'dsa',text:'Solve 3 LeetCode Easy problems (warm-up)'},{tag:'dsa',text:dsaTasks[0]||'Revise arrays and string patterns'},{tag:'dsa',text:dsaTasks[1]||'Practice binary search problems'},{tag:'dsa',text:dsaTasks[2]||'Recursion: N-Queens, subsets, permutations'},{tag:'dsa',text:dsaTasks[3]||'Dynamic Programming: 0/1 Knapsack, coin change'},{tag:'dsa',text:"Review yesterday's wrong solutions — understand root cause"},{tag:'dsa',text:'Solve 1 LeetCode Medium timed (< 25 min)'}],
    design:[{tag:'design',text:'Read 1 system design blog post (HLD focus)'},{tag:'design',text:'Sketch URL Shortener design (no reference)'},{tag:'design',text:'Study CAP theorem with real examples'},{tag:'design',text:'Design a rate limiter — token bucket vs leaky bucket'},{tag:'design',text:'Study database sharding strategies'}],
    resume:[{tag:'resume',text:'Rewrite 2 resume bullets with action verb + metric'},{tag:'resume',text:'Tailor resume summary for target role'},{tag:'resume',text:'Add 1 new quantified achievement to experience'},{tag:'resume',text:'ATS-check resume using Jobscan or similar'}],
    mock:[{tag:'mock',text:'Record a 10-min self-introduction — review tone'},{tag:'mock',text:'Practice 1 STAR answer out loud (failure story)'},{tag:'mock',text:'Simulate 30-min technical interview with timer'},{tag:'mock',text:'Practice "Tell me about yourself" — keep it under 90 seconds'}],
    apply:[{tag:'apply',text:'Apply to 3 companies via LinkedIn Easy Apply'},{tag:'apply',text:'Send 2 referral messages to alumni/connections'},{tag:'apply',text:'Follow up on applications older than 7 days'},{tag:'apply',text:'Research 5 new target companies — add to tracker'}]
  };
}

function renderMode(p){
  const b=document.getElementById('modeBanner');
  b.className=`mode-banner active`;
  document.getElementById('modeLabel').className=`mode-label ${p.modeColor}`;
  document.getElementById('modeIcon').textContent=p.modeIcon;
  document.getElementById('modeLabel').textContent=p.modeLabel;
  document.getElementById('modeDesc').textContent=p.modeDesc;
}
function renderRisk(p){
  const r=p.risk, b=document.getElementById('riskBanner');
  b.className=`risk-banner active ${r.cls}`;
  document.getElementById('riskIcon').textContent=r.icon;
  document.getElementById('riskText').innerHTML=`<strong>${r.label}</strong> — ${r.text}`;
}
function renderRoadmap(p){
  document.getElementById('roadmapDefault').style.display='none';
  document.getElementById('dynamicRoadmap').classList.add('active');
  document.getElementById('roadmapTitle').textContent=`${p.modeLabel} — ${p.days}-Day Custom Roadmap`;
  document.getElementById('roadmapPhases').innerHTML=p.phases.map(ph=>`
    <div class="drm-phase">
      <div class="drm-dot"></div>
      <div class="drm-phase-label">${ph.label}</div>
      <div class="drm-phase-title">${ph.title}</div>
      <div class="drm-phase-days">📅 ${ph.days} · ${ph.end-ph.start+1} days</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${ph.tags.map(t=>`<span class="tag ${t}">${t.replace('tag-','')}</span>`).join('')}</div>
      <div class="drm-tasks">${ph.tasks.map(t=>`<div class="drm-task">${t}</div>`).join('')}</div>
    </div>`).join('');
}
function renderReadiness(p){
  const r=p.readiness;
  const scoreColor=r.overall>=70?'var(--accent3)':r.overall>=45?'var(--gold)':'var(--accent2)';
  document.getElementById('readinessNumber').textContent=r.overall;
  document.getElementById('readinessNumber').style.color=scoreColor;
  document.getElementById('readinessBars').innerHTML=r.breakdown.map(b=>`
    <div class="rs-row">
      <span class="rs-skill">${b.label}</span>
      <div class="rs-bar-bg"><div class="rs-bar-fill" style="background:${b.color};width:${b.pct}%"></div></div>
      <span class="rs-pct" style="color:${b.color}">${b.pct}%</span>
    </div>`).join('');
  const alert=document.getElementById('rsWeakAlert');
  alert.style.display='block';
  alert.innerHTML=`⚠️ &nbsp;Your biggest risk area is <strong>${r.weakest.label}</strong> at ${r.weakest.pct}%. Allocate extra time here immediately — it has the highest impact on your score.`;
}
function updateHeroStats(p){
  const ms={deep:'DEEP',balanced:'BAL.',fast:'FAST',crash:'CRASH'};
  document.getElementById('pstat-mode').textContent=ms[p.mode]||p.mode;
  document.getElementById('pstat-score').textContent=p.readiness.overall+'%';
}

function buildDailyPlan(p){ if(!p) return; plannerDay=1; renderPlannerDay(); }
function detectPhaseType(title){
  const t=title.toLowerCase();
  if(t.includes('sql')||t.includes('dsa')||t.includes('foundations')||t.includes('sprint')||t.includes('algorithm')) return 'dsa';
  if(t.includes('design')||t.includes('system')||t.includes('infra')||t.includes('cloud')) return 'design';
  if(t.includes('resume')||t.includes('outreach')||t.includes('apply')) return 'apply';
  if(t.includes('mock')||t.includes('interview')) return 'mock';
  return 'dsa';
}
function getDayTasks(day){
  if(!placementState) return [];
  const p=placementState, pool=p.taskPool;
  const phase=p.phases.find(ph=>day>=ph.start&&day<=ph.end);
  const phaseType=phase?detectPhaseType(phase.title):'dsa';
  const tasks=[], seed=day;
  const primaryPool=pool[phaseType]||pool.dsa;
  tasks.push(primaryPool[seed%primaryPool.length]);
  tasks.push(primaryPool[(seed+2)%primaryPool.length]);
  if(p.res<4) tasks.push(pool.resume[seed%pool.resume.length]);
  if(day>5) tasks.push(pool.apply[seed%pool.apply.length]);
  if(day>Math.floor(p.days*.4)) tasks.push(pool.mock[seed%pool.mock.length]);
  const seen=new Set();
  return tasks.filter(t=>{ if(seen.has(t.text)) return false; seen.add(t.text); return true; });
}
function renderPlannerDay(){
  if(!placementState) return;
  const p=placementState, tasks=getDayTasks(plannerDay);
  document.getElementById('plannerDayLabel').textContent=`Day ${plannerDay} of ${p.days}`;
  document.getElementById('plannerDayCount').textContent=`Day ${plannerDay} / ${p.days}`;
  const container=document.getElementById('plannerTasks');
  if(!tasks.length){ container.innerHTML='<div class="planner-empty">No tasks for this day.</div>'; return; }
  container.innerHTML=tasks.map((t,i)=>`
    <div class="pt-item" onclick="togglePTask(this)">
      <div class="pt-check"></div>
      <span class="pt-tag ${t.tag}">${t.tag}</span>
      <span class="pt-text">${t.text}</span>
    </div>`).join('');
}
function togglePTask(el){ el.classList.toggle('done'); el.querySelector('.pt-check').textContent=el.classList.contains('done')?'✓':''; }
function plannerPrev(){ if(!placementState||plannerDay<=1) return; plannerDay--; renderPlannerDay(); }
function plannerNext(){ if(!placementState||plannerDay>=placementState.days) return; plannerDay++; renderPlannerDay(); }

function switchPTab(name,btn){
  document.querySelectorAll('.ptab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ptab').forEach(t=>t.classList.remove('active'));
  document.getElementById('ptab-'+name).classList.add('active');
  if(btn) btn.classList.add('active');
}

function openModal(){
  document.getElementById('appModal').classList.add('active');
  ['m-company','m-role'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('m-referral').value='no';
  document.getElementById('m-status').value='applied';
  document.getElementById('m-followup').value='';
  document.getElementById('m-date').value=new Date().toISOString().split('T')[0];
}
function closeModal(){ document.getElementById('appModal').classList.remove('active'); }
function saveApplication(){
  const company=document.getElementById('m-company').value.trim();
  if(!company){ alert('Please enter a company name.'); return; }
  applications.push({company,role:document.getElementById('m-role').value.trim(),date:document.getElementById('m-date').value,referral:document.getElementById('m-referral').value,status:document.getElementById('m-status').value,followup:document.getElementById('m-followup').value,id:Date.now()});
  closeModal(); renderTracker(); updateHeroApps();
}
function deleteApplication(id){ applications=applications.filter(a=>a.id!==id); renderTracker(); updateHeroApps(); }
function renderTracker(){
  const body=document.getElementById('trackerBody');
  if(!applications.length){ body.innerHTML=`<tr><td colspan="8" style="text-align:center;padding:28px;color:var(--muted);font-size:.72rem;">No applications tracked yet. Click "+ Add Application" to start.</td></tr>`; updateTrackerStats(); return; }
  const sCls={applied:'status-applied',screening:'status-screening',interview:'status-interview',offer:'status-offer',rejected:'status-rejected',followup:'status-followup'};
  const sLbl={applied:'Applied',screening:'Screening',interview:'Interview',offer:'🎉 Offer',rejected:'Rejected',followup:'Follow-up'};
  body.innerHTML=applications.map((a,i)=>`<tr>
    <td style="color:var(--muted)">${i+1}</td>
    <td style="font-family:'Syne',sans-serif;font-weight:600">${a.company}</td>
    <td style="color:var(--muted)">${a.role||'—'}</td>
    <td style="color:var(--muted)">${a.date||'—'}</td>
    <td class="${a.referral==='yes'?'ref-yes':'ref-no'}">${a.referral==='yes'?'✓ Yes':'No'}</td>
    <td><span class="status-pill ${sCls[a.status]||'status-applied'}">${sLbl[a.status]||a.status}</span></td>
    <td style="color:var(--muted)">${a.followup||'—'}</td>
    <td><button class="tracker-del-btn" onclick="deleteApplication(${a.id})">✕</button></td>
  </tr>`).join('');
  updateTrackerStats();
}
function updateTrackerStats(){
  const c=s=>applications.filter(a=>a.status===s).length;
  document.getElementById('ts-applied').textContent=c('applied');
  document.getElementById('ts-screening').textContent=c('screening');
  document.getElementById('ts-interview').textContent=c('interview');
  document.getElementById('ts-offer').textContent=c('offer');
  document.getElementById('ts-rejected').textContent=c('rejected');
}
function updateHeroApps(){ document.getElementById('pstat-apps').textContent=applications.length; }

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('appModal').addEventListener('click',function(e){ if(e.target===this) closeModal(); });
});
