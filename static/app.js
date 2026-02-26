/* ═══════════════════════════════════════════════
   CareerOS — app.js
   Page routing + OfferIQ engine + Interview
   checklist + Resume preview + Q&A toggle
═══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════
   ROUTING
══════════════════════════════════════════════ */
const PAGES = ['home', 'offeriq', 'placement', 'interview', 'resume'];

const PAGE_LABELS = {
  home:      'Home',
  offeriq:   'OfferIQ',
  placement: 'Placement Strategy',
  interview: 'Interview Preparation',
  resume:    'Resume Builder',
};

function navigate(page) {
  // hide all pages
  PAGES.forEach(p => {
    document.getElementById('page-' + p).classList.remove('active');
  });
  // show selected
  document.getElementById('page-' + page).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const bc       = document.getElementById('breadcrumb');
  const crumb    = document.getElementById('crumb-current');
  const sublabel = document.getElementById('header-sublabel');

  if (page === 'home') {
    bc.style.display = 'none';
    sublabel.textContent = 'AI Career Companion System';
  } else {
    bc.style.display = 'flex';
    crumb.textContent = PAGE_LABELS[page];
    sublabel.textContent = PAGE_LABELS[page];
  }

  // lazy init per page
  if (page === 'offeriq')   initOfferIQ();
  if (page === 'interview') initChecklist();
}

/* ══════════════════════════════════════════════
   OFFERIQ ENGINE
══════════════════════════════════════════════ */
let offers      = [];
let msgCount    = 0;
let offerIQReady = false;

/* ── Chat responses ── */
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
  'What\'s the growth potential and WLB rating (1–5)?',
  'Fill in the form on the right — the engine will rank it instantly.',
  'Once added, I\'ll narrate the full score breakdown here.',
];

/* ── Scoring config ── */
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

const LAYOFF_B = [
  { max:  5, pts: 15 }, { max: 15, pts: 11 },
  { max: 30, pts:  7 }, { max: 50, pts:  3 }, { max: 100, pts: 1 },
];
const BOND_B = [
  { max:  0, pts: 10 }, { max:  6, pts: 8 },
  { max: 12, pts:  6 }, { max: 24, pts: 3 }, { max: 999, pts: 1 },
];
const CTC_B = [
  { min: 5000000, pts: 25 }, { min: 3000000, pts: 20 },
  { min: 1500000, pts: 15 }, { min:  800000, pts: 10 },
  { min:  300000, pts:  5 }, { min:       0, pts:  2 },
];

const RANK_COLORS = ['var(--gold)', 'var(--accent)', 'var(--accent3)', 'var(--muted)', 'var(--muted)'];

/* ── Scoring helpers ── */
function bMax(v, b) {
  for (const x of b) { if (v <= x.max) return x.pts; }
  return b[b.length - 1].pts;
}
function bMin(v, b) {
  for (const x of b) { if (v >= x.min) return x.pts; }
  return b[b.length - 1].pts;
}

function normCTC() {
  if (!offers.length) return;
  const vals = offers.map(o => parseFloat(o.ctc) || 0);
  const mn = Math.min(...vals), mx = Math.max(...vals);
  offers.forEach(o => {
    const v = parseFloat(o.ctc) || 0;
    o.ctc_score = mx === mn ? 12 : Math.round(((v - mn) / (mx - mn)) * 25);
  });
}

function scoreOffer(o) {
  let s = 0;
  s += o.ctc_score !== undefined ? o.ctc_score : bMin(parseFloat(o.ctc) || 0, CTC_B);
  s += GROWTH_S[parseInt(o.growth_potential)]  ?? 0;
  s += WLB_S[parseInt(o.wlb)]                  ?? 0;
  s += bMax(parseFloat(o.layoff_rate)   || 0, LAYOFF_B);
  s += bMax(parseFloat(o.bond_duration) || 0, BOND_B);
  s += LOCATION_S[parseInt(o.location)] ?? 0;
  return Math.min(Math.round(s), 100);
}

function explainTop(t) {
  const c = {
    'CTC':        t.ctc_score ?? bMin(parseFloat(t.ctc) || 0, CTC_B),
    'Growth':     GROWTH_S[parseInt(t.growth_potential)] ?? 0,
    'WLB':        WLB_S[parseInt(t.wlb)] ?? 0,
    'Layoff Rate':bMax(parseFloat(t.layoff_rate)   || 0, LAYOFF_B),
    'Bond':       bMax(parseFloat(t.bond_duration) || 0, BOND_B),
    'Location':   LOCATION_S[parseInt(t.location)] ?? 0,
  };
  const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
  return `"${t.name}" leads primarily due to <strong>${top}</strong>.`;
}

/* ── OfferIQ init ── */
function initOfferIQ() {
  if (offerIQReady) return;
  offerIQReady = true;
  AI_WELCOME.forEach(m => addMsg(m, 'ai'));
  renderFactorBars();
  renderRankings();
  document.getElementById('chatInput')
    .addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
}

/* ── Chat functions ── */
function sendMessage() {
  const inp = document.getElementById('chatInput');
  const val = inp.value.trim();
  if (!val) return;
  addMsg(val, 'user');
  inp.value = '';
  setTimeout(showTyping, 400);
  setTimeout(() => {
    removeTyping();
    const key = Object.keys(AI_RESPONSE_MAP).find(k => val.toLowerCase().includes(k));
    addMsg(key ? AI_RESPONSE_MAP[key] : AI_DEFAULTS[msgCount % AI_DEFAULTS.length], 'ai');
    msgCount++;
  }, 1400);
}

function sendQuick(t) {
  document.getElementById('chatInput').value = t;
  sendMessage();
}

function addMsg(text, type) {
  const c = document.getElementById('chatMessages');
  const d = document.createElement('div');
  d.className = 'msg ' + type;
  d.innerHTML = `<div class="msg-icon">${type === 'ai' ? 'IQ' : '👤'}</div><div class="msg-bubble">${text}</div>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function showTyping() {
  const c = document.getElementById('chatMessages');
  const d = document.createElement('div');
  d.className = 'msg ai';
  d.id = 'typingMsg';
  d.innerHTML = `<div class="msg-icon">IQ</div>
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typingMsg');
  if (el) el.remove();
}

/* ── Add offer form ── */
function addOffer() {
  const o = {
    name:             document.getElementById('offerName').value.trim(),
    ctc:              document.getElementById('ctc').value,
    growth_potential: document.getElementById('growth_potential').value,
    wlb:              document.getElementById('wlb').value,
    layoff_rate:      document.getElementById('layoff_rate').value,
    bond_duration:    document.getElementById('bond_duration').value,
    location:         document.getElementById('location').value,
  };
  if (!o.name) { alert('Please enter a company name.'); return; }

  const btn = document.getElementById('analyzeBtn');
  btn.classList.add('loading');
  document.getElementById('analyzeLabel').textContent = 'Analyzing...';

  setTimeout(() => {
    offers.push(o);
    normCTC();
    offers.forEach(x => { x.score = scoreOffer(x); });
    offers.sort((a, b) => b.score - a.score);
    renderRankings();

    const rank = offers.findIndex(x => x.name === o.name) + 1;
    const expl = offers.length === 1 ? explainTop(offers[0]) : '';
    addMsg(`"<strong>${o.name}</strong>" added — Score: <strong>${o.score}/100</strong>, Rank #${rank} of ${offers.length}. ${expl}`, 'ai');

    showHint(offers.length);
    btn.classList.remove('loading');
    document.getElementById('analyzeLabel').textContent = '+ Add & Analyze Offer';
    clearOfferForm();
    animateBars();
    document.getElementById('analyzeBtn').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 1000);
}

function showHint(n) {
  const h = document.getElementById('offerHint');
  h.style.display = 'flex';
  document.getElementById('offerHintText').textContent = n === 1
    ? '✓ First offer added! Fill the form again to add another and compare.'
    : `✓ ${n} offers ranked. Add more — rankings update automatically.`;
}

function clearAllOffers() {
  if (!confirm(`Remove all ${offers.length} offer(s)?`)) return;
  offers = [];
  document.getElementById('rankingList').innerHTML =
    '<div class="empty-state">No offers yet — add your first offer above.</div>';
  document.getElementById('resultsMeta').textContent = 'Awaiting analysis...';
  document.getElementById('offerHint').style.display = 'none';
  document.getElementById('offerCountBar').style.display = 'none';
  document.getElementById('clearAllBtn').style.display  = 'none';
  addMsg('All offers cleared.', 'ai');
}

function clearOfferForm() {
  ['offerName', 'ctc', 'layoff_rate', 'bond_duration']
    .forEach(id => { document.getElementById(id).value = ''; });
  ['growth_potential', 'wlb', 'location']
    .forEach(id => { document.getElementById(id).value = ''; });
}

/* ── Render rankings ── */
function renderRankings() {
  const list    = document.getElementById('rankingList');
  const meta    = document.getElementById('resultsMeta');
  const countBar = document.getElementById('offerCountBar');
  const clrBtn  = document.getElementById('clearAllBtn');

  meta.textContent = `${offers.length} offer${offers.length !== 1 ? 's' : ''} analyzed`;

  if (offers.length > 0) {
    countBar.style.display = 'flex';
    clrBtn.style.display   = 'inline-block';
    document.getElementById('offerCount').textContent = offers.length;
  } else {
    countBar.style.display = 'none';
    clrBtn.style.display   = 'none';
  }

  if (!offers.length) {
    list.innerHTML = '<div class="empty-state">No offers yet — add your first offer above.</div>';
    return;
  }

  const GL = { 5:'Very High', 4:'High', 3:'Moderate', 2:'Low', 1:'Very Low' };
  const WL = { 5:'WLB: Excellent', 4:'WLB: Good', 3:'WLB: Avg', 2:'WLB: Below Avg', 1:'WLB: Poor' };

  list.innerHTML = offers.map((o, i) => {
    const rank  = i + 1;
    const color = RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)];
    const ctcFmt = o.ctc ? `₹${Number(o.ctc).toLocaleString('en-IN')}` : '';
    const gl = GL[parseInt(o.growth_potential)] || '';
    const wl = WL[parseInt(o.wlb)] || '';
    return `
      <div class="offer-rank">
        <div class="rank-num rank-${Math.min(rank, 5)}">${rank}</div>
        <div class="rank-info">
          <div class="rank-name">${o.name}</div>
          <div class="rank-tags">
            ${ctcFmt        ? `<span class="tag tag-green">${ctcFmt}</span>`          : ''}
            ${gl            ? `<span class="tag tag-cyan">Growth: ${gl}</span>`       : ''}
            ${wl            ? `<span class="tag tag-gold">${wl}</span>`               : ''}
            ${o.layoff_rate ? `<span class="tag tag-orange">Layoff: ${o.layoff_rate}%</span>` : ''}
            ${o.bond_duration ? `<span class="tag tag-cyan">Bond: ${o.bond_duration}mo</span>` : ''}
          </div>
        </div>
        <div class="rank-score">
          <div class="score-val" style="color:${color}">${o.score}</div>
          <div class="score-label">/ 100</div>
          <div class="score-bar">
            <div class="score-fill" style="background:${color}" data-w="${o.score}"></div>
          </div>
        </div>
      </div>`;
  }).join('');

  setTimeout(animateBars, 100);
}

/* ── Factor weight bars ── */
function renderFactorBars() {
  document.getElementById('factorBars').innerHTML =
    Object.entries(WEIGHTS).map(([, cfg]) => `
      <div class="factor-row">
        <span class="factor-name">${cfg.label}</span>
        <div class="factor-bar-bg">
          <div class="factor-bar-fill" style="background:${cfg.color}" data-w="${cfg.maxPts}"></div>
        </div>
        <span class="factor-pct" style="color:${cfg.color}">${cfg.maxPts} pts</span>
      </div>`).join('');
}

/* ── Bar animation ── */
function animateBars() {
  document.querySelectorAll('[data-w]').forEach(el => {
    el.style.width = el.dataset.w + '%';
  });
}

const barObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) animateBars(); });
}, { threshold: 0.2 });

/* ══════════════════════════════════════════════
   INTERVIEW CHECKLIST
══════════════════════════════════════════════ */
const CHECKLIST_ITEMS = [
  'Research the company — products, funding, recent news',
  'Re-read the job description, note key requirements',
  'Prepare 3 STAR stories for behavioral questions',
  'Review your resume top to bottom — know every line',
  'Prepare 3–5 thoughtful questions to ask the interviewer',
  'Test your video/audio setup if it\'s a virtual interview',
  'Plan your route / login link — be 10 min early',
  'Sleep 7–8 hours and eat a good meal before',
];

function initChecklist() {
  const container = document.getElementById('checklist');
  if (container.children.length > 0) return;

  CHECKLIST_ITEMS.forEach((item, i) => {
    const div = document.createElement('div');
    div.style.cssText =
      'display:flex;align-items:flex-start;gap:10px;padding:10px 14px;' +
      'background:var(--card);border:1px solid var(--border);border-radius:3px;' +
      'cursor:pointer;transition:all .2s;font-size:.72rem;';
    div.innerHTML =
      `<span id="chk-${i}" style="width:14px;height:14px;border:1px solid var(--border);` +
      `border-radius:2px;flex-shrink:0;margin-top:1px;display:flex;align-items:center;` +
      `justify-content:center;font-size:.6rem;transition:all .2s;"></span>` +
      `<span>${item}</span>`;
    div.onclick = () => {
      const chk     = document.getElementById('chk-' + i);
      const checked = chk.textContent === '✓';
      chk.textContent    = checked ? '' : '✓';
      chk.style.background   = checked ? 'transparent'      : 'var(--accent3)';
      chk.style.borderColor  = checked ? 'var(--border)'    : 'var(--accent3)';
      chk.style.color        = checked ? ''                 : 'var(--bg)';
      div.style.opacity      = checked ? '1'                : '.6';
    };
    container.appendChild(div);
  });
}

/* ══════════════════════════════════════════════
   Q&A ACCORDION
══════════════════════════════════════════════ */
function toggleQ(el) {
  const wasOpen = el.classList.contains('open');
  document.querySelectorAll('.q-item.open').forEach(q => q.classList.remove('open'));
  if (!wasOpen) el.classList.add('open');
}

/* ══════════════════════════════════════════════
   RESUME LIVE PREVIEW
══════════════════════════════════════════════ */
function updatePreview() {
  const g = id => document.getElementById(id)?.value || '';

  document.getElementById('pv_name').textContent        = g('r_name')        || 'Your Name';
  document.getElementById('pv_title').textContent       = g('r_title')       || 'Job Title / Role';
  document.getElementById('pv_email').textContent       = g('r_email')       || 'email@domain.com';
  document.getElementById('pv_phone').textContent       = g('r_phone')       || '+91 XXXXXXXXXX';
  document.getElementById('pv_location').textContent    = g('r_location')    || 'Location';
  document.getElementById('pv_link').textContent        = g('r_link')        || 'linkedin.com/in/you';
  document.getElementById('pv_summary').textContent     = g('r_summary')     || 'Your summary will appear here...';
  document.getElementById('pv_company').textContent     = g('r_company')     || 'Company Name';
  document.getElementById('pv_role').textContent        = g('r_role')        || 'Role / Designation';
  document.getElementById('pv_duration').textContent    = g('r_duration')    || 'Duration';
  document.getElementById('pv_degree').textContent      = g('r_degree')      || 'Degree';
  document.getElementById('pv_institution').textContent = g('r_institution') || 'Institution';
  document.getElementById('pv_year').textContent        = g('r_year')        || 'Year';
  document.getElementById('pv_cgpa').textContent        = g('r_cgpa')        || 'CGPA';

  // Achievements
  const ach = g('r_achievements').split('\n').filter(l => l.trim());
  document.getElementById('pv_achievements').innerHTML =
    ach.map(l => `<li>${l}</li>`).join('') ||
    '<li style="color:var(--muted)">Achievements will appear here...</li>';

  // Skills
  const skills = g('r_skills').split(',').map(s => s.trim()).filter(Boolean);
  document.getElementById('pv_skills').innerHTML =
    skills.map(s => `<span class="tag tag-cyan" style="font-size:.62rem">${s}</span>`).join('') ||
    '<span style="font-size:.68rem;color:var(--muted)">Skills will appear here...</span>';

  // Certifications
  const certs = g('r_certs').split('\n').filter(l => l.trim());
  document.getElementById('pv_certs').innerHTML =
    certs.map(c => `<li>${c}</li>`).join('') ||
    '<li style="color:var(--muted)">Certifications will appear here...</li>';
}

function exportResume() {
  const g = id => document.getElementById(id)?.value || '';
  const text = `
${g('r_name').toUpperCase()}
${g('r_title')} | ${g('r_email')} | ${g('r_phone')} | ${g('r_location')}
${g('r_link')}

SUMMARY
${g('r_summary')}

EXPERIENCE
${g('r_role')} — ${g('r_company')} (${g('r_duration')})
${g('r_achievements').split('\n').map(l => '• ' + l).join('\n')}

EDUCATION
${g('r_degree')} — ${g('r_institution')} (${g('r_year')}) | ${g('r_cgpa')}

SKILLS
${g('r_skills')}

CERTIFICATIONS
${g('r_certs')}
  `.trim();

  const blob = new Blob([text], { type: 'text/plain' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = (g('r_name') || 'Resume').replace(/\s+/g, '_') + '_Resume.txt';
  a.click();
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Observe factor bars section for scroll animation
  document.querySelectorAll('.factors-card').forEach(el => barObs.observe(el));

  // Smooth scroll for any anchor links
  document.querySelectorAll("a[href^='#']").forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });
  });
});
