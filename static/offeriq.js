/* ══════════════════════════════════════════════
   OFFERIQ ENGINE — Separate Add & Analyze
══════════════════════════════════════════════ */
let offers = [], msgCount = 0;

const AI_WELCOME = [
  "Hello! I'm OfferIQ. I'll help you analyze and rank your job offers.",
  "Fill in the form and click '+ Add Offer' to save, then hit 'Analyze All' to rank.",
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
  'Fill in the form on the right — click Add Offer to save it.',
  "Once you've added all offers, hit Analyze All to see the ranking.",
];
const WEIGHTS = {
  ctc:              { label: 'CTC',               maxPts: 25, color: 'var(--gold)'    },
  growth_potential: { label: 'Growth Potential',  maxPts: 28, color: 'var(--accent3)' },
  wlb:              { label: 'Work-Life Balance',  maxPts: 20, color: 'var(--accent)'  },
  layoff_rate:      { label: 'Layoff Rate',        maxPts: 15, color: 'var(--accent2)' },
  bond_duration:    { label: 'Bond Duration',      maxPts: 10, color: '#a0a0c0'        },
  location:         { label: 'Location Pref.',     maxPts: 12, color: 'var(--gold)'    },
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

/* ══════════════
   ADD OFFER — saves to list, no scoring yet
══════════════ */
function addOffer() {
  const form = document.getElementById('offerForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
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

// ── Layoff rate validation ──
const layoffVal = parseFloat(o.layoff_rate);
const layoffErr = document.getElementById('layoffError');
if (o.layoff_rate !== '' && (isNaN(layoffVal) || layoffVal < 0 || layoffVal > 100)) {
  layoffErr.style.display = 'block';
  document.getElementById('layoff_rate').focus();
  return;
}
layoffErr.style.display = 'none';
  const btn = document.getElementById('addBtn');
  btn.classList.add('loading');
  btn.textContent = 'Adding...';

  setTimeout(() => {
    offers.push(o);
    renderPendingList();
    addMsg(`"<strong>${o.name}</strong>" added to queue. Total: <strong>${offers.length}</strong> offer(s). Click <em>Analyze All</em> to rank them.`, 'ai');
    clearOfferForm();
    btn.classList.remove('loading');
    btn.textContent = '+ Add Offer';

    // Show analyze button once at least 1 offer exists
    document.getElementById('analyzeAllBtn').style.display = 'block';
  }, 500);
}

/* ══════════════
   ANALYZE ALL — scores and ranks all saved offers
══════════════ */
function analyzeAll() {
  if (!offers.length) { alert('Add at least one offer first.'); return; }
  if (offers.length < 2) {
    addMsg('⚠ Add at least 2 offers to compare. Analysis needs more than one offer to rank meaningfully.', 'ai');
    return;
  }

  const btn = document.getElementById('analyzeAllBtn');
  btn.classList.add('loading');
  btn.textContent = '⚡ Analyzing...';

  setTimeout(() => {
    // ── Final safety check before scoring ──
    const invalid = offers.find(o => {
      const v = parseFloat(o.layoff_rate);
      return !isNaN(v) && (v < 0 || v > 100);
    });
    if (invalid) {
      addMsg(`⚠ "${invalid.name}" has an invalid layoff rate. Remove it and re-add with a value between 0–100.`, 'ai');
      btn.classList.remove('loading');
      btn.textContent = '⚡ Analyze All Offers';
      return;
    }

    normCTC();
    offers.forEach(x => { x.score = scoreOffer(x); });
    offers.sort((a, b) => b.score - a.score);
    renderRankings();
    animateBars();

    const top = offers[0];
    addMsg(`Analysis complete! <strong>${top.name}</strong> ranks #1 with <strong>${top.score}/100</strong>. ${explainTop(top)}`, 'ai');

    btn.classList.remove('loading');
    btn.textContent = '⚡ Re-Analyze All';
  }, 1000);
  if (offers.length === 1) {
  addMsg('⚠ Only 1 offer added. CTC, layoff and bond are scored at midpoint — add more offers for accurate comparison.', 'ai');
}
}

/* ══════════════
   SCORING LOGIC
══════════════ */
function normCTC() {
  if (!offers.length) return;
  const vals = offers.map(o => parseFloat(o.ctc) || 0);
  const mn = Math.min(...vals), mx = Math.max(...vals);
  offers.forEach(o => {
    const v = parseFloat(o.ctc) || 0;
    // ── single offer — can't normalize, use midpoint and warn ──
    if (mx === mn) {
      o.ctc_score = 12;
      o.ctc_note  = 'CTC scored at midpoint — add more offers for accurate comparison';
    } else {
      o.ctc_score = Math.round(((v - mn) / (mx - mn)) * 25);
      o.ctc_note  = '';
    }
  });
}

function scoreOffer(o) {
  let s = 0;
  s += o.ctc_score !== undefined ? o.ctc_score : bMin(parseFloat(o.ctc) || 0, CTC_B);
  s += GROWTH_S[parseInt(o.growth_potential)] ?? 0;
  s += WLB_S[parseInt(o.wlb)] ?? 0;
  s += bMax(parseFloat(o.layoff_rate) || 0, LAYOFF_B);
  s += bMax(parseFloat(o.bond_duration) || 0, BOND_B);
  s += LOCATION_S[parseInt(o.location)] ?? 0;
  return Math.min(Math.round(s), 100);
}
function explainTop(t) {
  const c = {
    'CTC':        t.ctc_score ?? bMin(parseFloat(t.ctc) || 0, CTC_B),
    'Growth':     GROWTH_S[parseInt(t.growth_potential)] ?? 0,
    'WLB':        WLB_S[parseInt(t.wlb)] ?? 0,
    'Layoff Rate':bMax(parseFloat(t.layoff_rate) || 0, LAYOFF_B),
    'Bond':       bMax(parseFloat(t.bond_duration) || 0, BOND_B),
    'Location':   LOCATION_S[parseInt(t.location)] ?? 0,
  };
  const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
  return `"${t.name}" leads primarily due to <strong>${top}</strong>.`;
}

/* ══════════════
   RENDER PENDING LIST (before analysis)
══════════════ */
function renderPendingList() {
  const list = document.getElementById('rankingList');
  if (!offers.length) {
    list.innerHTML = '<div class="empty-state">No offers yet — add your first offer above.</div>';
    return;
  }
  list.innerHTML = `
    <div style="font-size:.68rem;color:var(--muted);margin-bottom:12px;padding:8px 12px;
         background:var(--surface);border:1px solid var(--border);border-radius:4px;">
      ${offers.length} offer(s) queued — click <strong style="color:var(--accent)">Analyze All</strong> to rank them.
    </div>` +
    offers.map((o, i) => `
      <div class="offer-rank" style="opacity:0.7">
        <div class="rank-num" style="background:var(--surface);color:var(--muted);border:1px solid var(--border)">${i + 1}</div>
        <div class="rank-info">
          <div class="rank-name">${o.name}</div>
          <div class="rank-tags">
            ${o.ctc ? `<span class="tag tag-green">₹${Number(o.ctc).toLocaleString('en-IN')}</span>` : ''}
            <span class="tag" style="background:rgba(255,255,255,.05);color:var(--muted)">Not analyzed yet</span>
          </div>
        </div>
        <div class="rank-score">
          <button onclick="removeOffer(${i})"
            style="background:transparent;border:1px solid var(--border);color:var(--muted);
                   padding:3px 8px;font-size:.6rem;border-radius:2px;cursor:pointer;">✕ Remove</button>
        </div>
      </div>`).join('');
}

function removeOffer(index) {
  offers.splice(index, 1);
  renderPendingList();
  addMsg(`Offer removed. ${offers.length} offer(s) remaining in queue.`, 'ai');
  if (!offers.length) document.getElementById('analyzeAllBtn').style.display = 'none';
}

/* ══════════════
   RENDER RANKED LIST (after analysis)
══════════════ */
function renderRankings() {
  const list     = document.getElementById('rankingList');
  const meta     = document.getElementById('resultsMeta');
  const countBar = document.getElementById('offerCountBar');
  const clrBtn   = document.getElementById('clearAllBtn');

  meta.textContent = `${offers.length} offer${offers.length !== 1 ? 's' : ''} analyzed`;
  if (offers.length > 0) {
    countBar.style.display = 'flex';
    clrBtn.style.display   = 'inline-block';
    document.getElementById('offerCount').textContent = offers.length;
  }

  const GL = { 5:'Very High', 4:'High', 3:'Moderate', 2:'Low', 1:'Very Low' };
  const WL = { 5:'WLB: Excellent', 4:'WLB: Good', 3:'WLB: Avg', 2:'WLB: Below Avg', 1:'WLB: Poor' };

  list.innerHTML = offers.map((o, i) => {
    const rank  = i + 1;
    const color = RANK_COLORS[Math.min(i, RANK_COLORS.length - 1)];
    const ctcFmt = o.ctc ? `₹${Number(o.ctc).toLocaleString('en-IN')}` : '';
    const gl = GL[parseInt(o.growth_potential)] || '';
    const wl = WL[parseInt(o.wlb)] || '';
    return `<div class="offer-rank">
      <div class="rank-num rank-${Math.min(rank, 5)}">${rank}</div>
      <div class="rank-info">
        <div class="rank-name">${o.name}</div>
        <div class="rank-tags">
          ${ctcFmt  ? `<span class="tag tag-green">${ctcFmt}</span>` : ''}
          ${gl      ? `<span class="tag tag-cyan">Growth: ${gl}</span>` : ''}
          ${wl      ? `<span class="tag tag-gold">${wl}</span>` : ''}
          ${o.layoff_rate   ? `<span class="tag tag-orange">Layoff: ${o.layoff_rate}%</span>` : ''}
          ${o.bond_duration ? `<span class="tag tag-cyan">Bond: ${o.bond_duration}mo</span>` : ''}
        </div>
      </div>
      <div class="rank-score">
        <div class="score-val" style="color:${color}">${o.score}</div>
        <div class="score-label">/ 100</div>
        <div class="score-bar"><div class="score-fill" style="background:${color}" data-w="${o.score}"></div></div>
      </div>
    </div>`;
  }).join('');

  setTimeout(animateBars, 100);
}

/* ══════════════
   CLEAR ALL
══════════════ */
function clearAllOffers() {
  if (!confirm(`Remove all ${offers.length} offer(s)?`)) return;
  offers = [];
  document.getElementById('rankingList').innerHTML = '<div class="empty-state">No offers yet — add your first offer above.</div>';
  document.getElementById('resultsMeta').textContent = 'Awaiting analysis...';
  document.getElementById('offerHint').style.display = 'none';
  document.getElementById('offerCountBar').style.display = 'none';
  document.getElementById('clearAllBtn').style.display = 'none';
  document.getElementById('analyzeAllBtn').style.display = 'none';
  addMsg('All offers cleared.', 'ai');
}

function clearOfferForm() {
  ['offerName','ctc','layoff_rate','bond_duration'].forEach(id => document.getElementById(id).value = '');
  ['growth_potential','wlb','location'].forEach(id => document.getElementById(id).selectedIndex = 0);
  document.getElementById('layoffError').style.display = 'none';
}

/* ══════════════
   CHAT
══════════════ */
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
  d.className = 'msg ai'; d.id = 'typingMsg';
  d.innerHTML = `<div class="msg-icon">IQ</div><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}
function removeTyping() { const el = document.getElementById('typingMsg'); if (el) el.remove(); }
function sendMessage() {
  const inp = document.getElementById('chatInput');
  const val = inp.value.trim(); if (!val) return;
  addMsg(val, 'user'); inp.value = '';
  setTimeout(showTyping, 400);
  setTimeout(() => {
    removeTyping();
    const key = Object.keys(AI_RESPONSE_MAP).find(k => val.toLowerCase().includes(k));
    addMsg(key ? AI_RESPONSE_MAP[key] : AI_DEFAULTS[msgCount % AI_DEFAULTS.length], 'ai');
    msgCount++;
  }, 1400);
}
function sendQuick(t) { document.getElementById('chatInput').value = t; sendMessage(); }

/* ══════════════
   FACTOR BARS
══════════════ */
function renderFactorBars() {
  document.getElementById('factorBars').innerHTML = Object.entries(WEIGHTS).map(([, cfg]) => `
    <div class="factor-row">
      <span class="factor-name">${cfg.label}</span>
      <div class="factor-bar-bg"><div class="factor-bar-fill" style="background:${cfg.color}" data-w="${cfg.maxPts}"></div></div>
      <span class="factor-pct" style="color:${cfg.color}">${cfg.maxPts} pts</span>
    </div>`).join('');
}
function animateBars() {
  document.querySelectorAll('[data-w]').forEach(el => { el.style.width = el.dataset.w + '%'; });
}

const barObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) animateBars(); });
}, { threshold: 0.2 });

/* ══════════════
   INIT
══════════════ */
document.addEventListener('DOMContentLoaded', () => {
  AI_WELCOME.forEach(m => addMsg(m, 'ai'));
  renderFactorBars();
  renderPendingList();
  document.getElementById('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
  document.querySelectorAll('.factors-card').forEach(el => barObs.observe(el));
});
